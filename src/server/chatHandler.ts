import type { IncomingMessage, ServerResponse } from 'http';

interface ChatRequestBody {
  provider: {
    id?: string;
    name?: string;
    baseUrl: string;
    apiKey: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: Array<{
      name: string;
      content: string;
      isImage?: boolean;
      type?: string;
    }>;
  }>;
  stream?: boolean;
}

export async function handleChatApi(req: IncomingMessage, res: ServerResponse) {
  // Read body
  let bodyStr = '';
  for await (const chunk of req) {
    bodyStr += chunk;
  }

  let body: ChatRequestBody;
  try {
    body = JSON.parse(bodyStr);
  } catch (e) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid JSON request body' }));
    return;
  }

  const { provider, messages, stream = true } = body;

  if (!provider || !messages || !Array.isArray(messages)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing required fields: provider and messages' }));
    return;
  }

  // Format messages for OpenAI format
  const formattedMessages = messages.map((msg) => {
    let textContent = msg.content || '';

    // Append text attachment contents if present
    if (msg.attachments && msg.attachments.length > 0) {
      const textAttachments = msg.attachments.filter((a) => !a.isImage);
      if (textAttachments.length > 0) {
        textContent +=
          '\n\n--- Attached Documents/Files ---\n' +
          textAttachments
            .map((a) => `[File: ${a.name}]\n${a.content}\n--- End of File ---`)
            .join('\n\n');
      }
    }

    // Check if image attachments exist for multimodal
    const imageAttachments = msg.attachments?.filter((a) => a.isImage && a.content) || [];

    if (imageAttachments.length > 0 && msg.role === 'user') {
      const parts: any[] = [{ type: 'text', text: textContent }];
      for (const img of imageAttachments) {
        parts.push({
          type: 'image_url',
          image_url: {
            url: img.content,
          },
        });
      }
      return {
        role: msg.role,
        content: parts,
      };
    }

    return {
      role: msg.role,
      content: textContent,
    };
  });

  const hasUserKey = provider.apiKey && provider.apiKey.trim() !== '' && provider.apiKey !== 'not-needed';
  const serverGeminiKey = process.env.GEMINI_API_KEY;

  let targetUrl = provider.baseUrl.trim().replace(/\/+$/, '');
  let activeModel = provider.model || 'gemini-2.5-flash';
  let authHeader = '';

  const isLocalServer = targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1');

  if (hasUserKey) {
    // User provided their own key
    authHeader = `Bearer ${provider.apiKey.trim()}`;
    if (!targetUrl.endsWith('/chat/completions')) {
      targetUrl += '/chat/completions';
    }
  } else if (isLocalServer) {
    // Local Ollama or LM Studio does not require API key
    if (!targetUrl.endsWith('/chat/completions')) {
      targetUrl += '/chat/completions';
    }
  } else if (serverGeminiKey && (provider.id === 'gemini' || targetUrl.includes('openai.com') || targetUrl.includes('generativelanguage'))) {
    // Seamless fallback to Google Gemini's OpenAI-compatible endpoint using environment key
    targetUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    authHeader = `Bearer ${serverGeminiKey}`;
    // If the selected model was an OpenAI model like gpt-4o, fallback to gemini-2.5-flash
    if (activeModel.startsWith('gpt-') || activeModel.startsWith('o1') || activeModel.startsWith('o3')) {
      activeModel = 'gemini-2.5-flash';
    }
  } else {
    // Cloud provider requested without an API key
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: `API Key required: Please open "API Key" in the sidebar and enter your key for ${provider.name || 'this provider'}, or switch to Google Gemini (Built-in).`,
      })
    );
    return;
  }

  // Forward request to AI Provider
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  // Some providers like OpenRouter require HTTP-Referer
  if (targetUrl.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = 'https://nexusai.local';
    headers['X-Title'] = 'NexusAI Studio';
  }

  const payload: any = {
    model: activeModel,
    messages: formattedMessages,
    temperature: provider.temperature ?? 0.7,
    stream: stream,
  };

  if (provider.maxTokens) {
    payload.max_tokens = provider.maxTokens;
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      let parsedMessage = errText;
      try {
        const json = JSON.parse(errText);
        parsedMessage = json.error?.message || json.message || errText;
      } catch {}

      res.statusCode = upstreamRes.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: `Provider error (${upstreamRes.status}): ${parsedMessage}`,
        })
      );
      return;
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      if (!upstreamRes.body) {
        res.end();
        return;
      }

      // Stream upstream SSE chunks to client
      const reader = upstreamRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          break;
        }
        res.write(value);
      }
    } else {
      const json = await upstreamRes.json();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(json));
    }
  } catch (err: any) {
    console.error('Error contacting AI Provider:', err);
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: `Could not reach ${provider.baseUrl}: ${err.message || 'Network error'}`,
      })
    );
  }
}

// Handler to auto-fetch models from custom URL provider
export async function handleFetchModelsApi(req: IncomingMessage, res: ServerResponse) {
  let bodyStr = '';
  for await (const chunk of req) {
    bodyStr += chunk;
  }

  let body: { baseUrl: string; apiKey?: string };
  try {
    body = JSON.parse(bodyStr);
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid JSON request' }));
    return;
  }

  const { baseUrl, apiKey } = body;
  if (!baseUrl) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing baseUrl' }));
    return;
  }

  let cleanUrl = baseUrl.trim().replace(/\/+$/, '');
  if (cleanUrl.endsWith('/chat/completions')) {
    cleanUrl = cleanUrl.replace(/\/chat\/completions$/, '');
  }

  // Determine auth header
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey && apiKey.trim() !== '' && apiKey !== 'not-needed') {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  } else if (process.env.GEMINI_API_KEY && (cleanUrl.includes('googleapis') || cleanUrl.includes('generativelanguage'))) {
    headers['Authorization'] = `Bearer ${process.env.GEMINI_API_KEY}`;
  }

  // Potential endpoints for models listing across providers
  const candidateEndpoints = [
    `${cleanUrl}/models`,
    `${cleanUrl}/v1/models`,
    `${cleanUrl}/api/tags`, // Ollama native tags
  ];

  let models: string[] = [];
  let lastError = '';

  for (const endpoint of candidateEndpoints) {
    try {
      const resp = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      if (resp.ok) {
        const json = await resp.json();

        // Standard OpenAI format: { data: [{ id: "model-name" }] }
        if (Array.isArray(json.data) && json.data.length > 0) {
          models = json.data.map((m: any) => m.id || m.name).filter(Boolean);
          break;
        }

        // Ollama native format: { models: [{ name: "llama3.2" }] }
        if (Array.isArray(json.models) && json.models.length > 0) {
          models = json.models.map((m: any) => m.name || m.model).filter(Boolean);
          break;
        }

        // Object map or direct array format
        if (Array.isArray(json)) {
          models = json.map((m: any) => (typeof m === 'string' ? m : m.id || m.name)).filter(Boolean);
          break;
        }
      } else {
        lastError = `HTTP ${resp.status}: ${resp.statusText}`;
      }
    } catch (e: any) {
      lastError = e.message || 'Network request failed';
    }
  }

  if (models.length > 0) {
    // Sort models cleanly
    models.sort();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ models }));
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: `Could not auto-fetch models from ${cleanUrl}. (${lastError || 'No models list returned'}). Please verify the Base URL or type the model name manually.`,
      })
    );
  }
}
