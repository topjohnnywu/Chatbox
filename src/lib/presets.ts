import { AIPersona, ProviderConfig } from '../types/chat';

export interface ProviderPreset {
  id: string;
  name: string;
  description: string;
  defaultBaseUrl: string;
  models: string[];
  placeholderKey: string;
  helpUrl?: string;
  badge?: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'gemini',
    name: 'Google Gemini (Built-in)',
    description: 'Gemini 2.5 Flash ready out of the box with zero setup',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
    placeholderKey: 'Uses environment key by default',
    badge: 'Ready to Chat',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4o-mini, o1, o3-mini models',
    defaultBaseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'gpt-4-turbo'],
    placeholderKey: 'sk-proj-...',
    badge: 'Standard',
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    description: 'Ultra-fast Llama 3.3, Mixtral, and DeepSeek-R1',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    models: [
      'llama-3.3-70b-versatile',
      'deepseek-r1-distill-llama-70b',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
    ],
    placeholderKey: 'gsk_...',
    badge: 'Ultra Fast',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Run open-weights models privately on your computer',
    defaultBaseUrl: 'http://localhost:11434/v1',
    models: ['llama3.2', 'deepseek-r1', 'qwen2.5-coder', 'mistral', 'phi4'],
    placeholderKey: 'ollama (no key needed)',
    badge: 'Private & Free',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    description: 'Local LLM GUI server on your Windows/Mac machine',
    defaultBaseUrl: 'http://localhost:1234/v1',
    models: ['local-model'],
    placeholderKey: 'not-needed',
    badge: 'Local GUI',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Unified gateway to Claude 3.5 Sonnet, Gemini, DeepSeek, Llama',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    models: [
      'anthropic/claude-3.5-sonnet',
      'deepseek/deepseek-r1',
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.0-flash-exp:free',
    ],
    placeholderKey: 'sk-or-v1-...',
    badge: 'Universal Router',
  },
  {
    id: 'custom',
    name: 'Custom Endpoint',
    description: 'Any OpenAI-compatible /v1/chat/completions server',
    defaultBaseUrl: 'https://api.your-provider.com/v1',
    models: ['custom-model'],
    placeholderKey: 'your-api-key',
    badge: 'Custom',
  },
];

export const DEFAULT_PROVIDER: ProviderConfig = {
  id: 'gemini',
  name: 'Google Gemini (Built-in)',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  apiKey: '',
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  maxTokens: 4096,
};

export const AI_PERSONAS: AIPersona[] = [
  {
    id: 'general',
    name: 'Claude Essence',
    badge: 'Balanced',
    description: 'Thoughtful, articulate, nuanced, and exceptionally helpful assistant.',
    iconName: 'Sparkles',
    systemPrompt:
      'You are a thoughtful, helpful, intellectually curious, and precise AI assistant. You provide nuanced, well-structured, clear answers with beautiful formatting, balanced reasoning, and insightful depth.',
  },
  {
    id: 'coder',
    name: 'Senior Architect',
    badge: 'Coding',
    description: 'Writes clean, production-grade, typed, and well-commented software.',
    iconName: 'Code',
    systemPrompt:
      'You are a world-class senior software engineer and systems architect. You prioritize clean code, idiomatic TypeScript/Python/Rust, production security, efficient algorithms, and robust edge-case handling. Always provide clear explanations alongside code.',
  },
  {
    id: 'writer',
    name: 'Technical Wordsmith',
    badge: 'Writing',
    description: 'Crafts elegant prose, compelling documentation, and clear essays.',
    iconName: 'PenTool',
    systemPrompt:
      'You are an exceptional writer and editor. You produce clear, engaging, rhythmically varied prose with zero corporate jargon or clichés. Focus on punchy active voice, logical hierarchy, and compelling flow.',
  },
  {
    id: 'researcher',
    name: 'Deep Researcher',
    badge: 'Analysis',
    description: 'Rigorous analysis, step-by-step logic, counterarguments, and syntheses.',
    iconName: 'Compass',
    systemPrompt:
      'You are a rigorous research scientist and strategic analyst. Break down complex multi-faceted inquiries methodically, cite reasoning principles, compare alternative hypotheses, and deliver dense, highly informative breakdowns.',
  },
  {
    id: 'concise',
    name: 'Executive Brief',
    badge: 'Concise',
    description: 'Direct bullet points, actionable answers, zero pleasantries.',
    iconName: 'Zap',
    systemPrompt:
      'You are an executive Chief of Staff. Give immediate, high-signal, ultra-concise answers. Use structured bullet points, clear decisions, and zero unnecessary conversational filler.',
  },
];
