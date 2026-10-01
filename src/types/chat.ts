export type Role = 'user' | 'assistant' | 'system';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // Base64 or text preview
  isImage?: boolean;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  reasoningContent?: string; // For DeepSeek-R1 / thinking models
  timestamp: number;
  attachments?: Attachment[];
  model?: string;
  isError?: boolean;
  tokensCount?: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  personaId: string;
  model: string;
  temperature: number;
  messages: Message[];
}

export interface AIPersona {
  id: string;
  name: string;
  badge: string;
  description: string;
  iconName: string;
  systemPrompt: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  isCustom?: boolean;
}

export interface UserMemory {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: number;
}

export type SendShortcut = 'enter' | 'ctrl-enter';
export type ThemeMode = 'dark' | 'light' | 'system';

export interface AppSettings {
  provider: ProviderConfig;
  theme: ThemeMode;
  sendShortcut: SendShortcut;
  customInstructions: string;
  activePersonaId: string;
  autoScroll: boolean;
  soundEnabled: boolean;
}
