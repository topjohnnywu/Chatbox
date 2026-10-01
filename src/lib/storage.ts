import { Conversation, AppSettings, UserMemory } from '../types/chat';
import { DEFAULT_PROVIDER } from './presets';

const STORAGE_KEYS = {
  CONVERSATIONS: 'nexus_ai_conversations',
  ACTIVE_ID: 'nexus_ai_active_id',
  SETTINGS: 'nexus_ai_settings',
  MEMORIES: 'nexus_ai_memories',
};

export const DEFAULT_SETTINGS: AppSettings = {
  provider: DEFAULT_PROVIDER,
  theme: 'dark',
  sendShortcut: 'enter',
  customInstructions: '',
  activePersonaId: 'general',
  autoScroll: true,
  soundEnabled: false,
};

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'welcome-chat',
    title: 'Welcome to NexusAI',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    isPinned: true,
    personaId: 'general',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    messages: [
      {
        id: 'msg-welcome-1',
        role: 'assistant',
        content: `👋 **Welcome to NexusAI Studio!**

I am your high-performance, Claude-inspired AI workspace. Here is what you can do right away:

### 🚀 Key Features
- **Bring Your Own Key (BYOK)**: Connect any OpenAI-compatible provider (*OpenAI, Groq, Ollama, LM Studio, OpenRouter, Google Gemini*).
- **Streaming Responses**: Real-time token streaming with syntax highlighting and interactive code copy.
- **Thinking / Reasoning Support**: Native support for reasoning tags (\`<think>...</think>\`) from models like DeepSeek-R1.
- **File & Code Context**: Attach code files, documents, or screenshots to ground prompts.
- **Cross-Platform UX**: Optimized with touch drawers on mobile and slim scrollbars with Windows shortcuts (\`Ctrl+K\` for search, \`Enter\` to send).

💡 *To test your own AI models, click **Provider Settings** in the left sidebar or the gear icon above!*`,
        timestamp: Date.now() - 3600000,
        model: 'NexusAI Core',
      },
    ],
  },
];

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) {
      saveConversations(INITIAL_CONVERSATIONS);
      return INITIAL_CONVERSATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CONVERSATIONS;
  } catch (e) {
    console.error('Failed to load conversations from localStorage', e);
    return INITIAL_CONVERSATIONS;
  }
}

export function saveConversations(conversations: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversations to localStorage', e);
  }
}

export function loadActiveConversationId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID) || 'welcome-chat';
  } catch {
    return 'welcome-chat';
  }
}

export function saveActiveConversationId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
  } catch (e) {
    console.error('Failed to save active conversation id', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    // If user has previous default without an API key pointing to OpenAI, migrate to default built-in Gemini
    if (
      parsed.provider &&
      (!parsed.provider.apiKey || parsed.provider.apiKey.trim() === '') &&
      parsed.provider.baseUrl?.includes('api.openai.com')
    ) {
      parsed.provider = DEFAULT_SETTINGS.provider;
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function loadMemories(): UserMemory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORIES);
    if (!raw) {
      const defaultMemories: UserMemory[] = [
        {
          id: 'mem-1',
          title: 'Preferred Tone',
          content: 'Be concise, thoughtful, and prioritize structured markdown with runnable code examples.',
          isActive: true,
          createdAt: Date.now(),
        },
      ];
      saveMemories(defaultMemories);
      return defaultMemories;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveMemories(memories: UserMemory[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
  } catch (e) {
    console.error('Failed to save memories', e);
  }
}

// Conversation Exporter
export function exportConversationToMarkdown(conv: Conversation): string {
  let md = `# ${conv.title}\n`;
  md += `*Exported on ${new Date().toLocaleString()} from NexusAI*\n`;
  md += `*Model: ${conv.model} | Temperature: ${conv.temperature}*\n\n---\n\n`;

  for (const msg of conv.messages) {
    const author = msg.role === 'user' ? '👤 **You**' : '🤖 **Assistant**';
    md += `### ${author} (${new Date(msg.timestamp).toLocaleTimeString()})\n\n`;
    if (msg.attachments && msg.attachments.length > 0) {
      md += `*Attachments: ${msg.attachments.map((a) => a.name).join(', ')}*\n\n`;
    }
    if (msg.reasoningContent) {
      md += `> **Thought Process:**\n> ${msg.reasoningContent.replace(/\n/g, '\n> ')}\n\n`;
    }
    md += `${msg.content}\n\n---\n\n`;
  }
  return md;
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
