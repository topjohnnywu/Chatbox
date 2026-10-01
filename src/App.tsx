import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Menu,
  Plus,
  Sliders,
  Sparkles,
  ArrowRight,
  Code,
  PenTool,
  Compass,
  Cpu,
  Download,
  Share2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import {
  Conversation,
  Message,
  Attachment,
  AppSettings,
  UserMemory,
} from './types/chat';
import {
  loadConversations,
  saveConversations,
  loadActiveConversationId,
  saveActiveConversationId,
  loadSettings,
  saveSettings,
  loadMemories,
  saveMemories,
} from './lib/storage';
import { AI_PERSONAS, DEFAULT_PROVIDER } from './lib/presets';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ProviderSettingsModal } from './components/ProviderSettingsModal';
import { MemoryModal } from './components/MemoryModal';
import { ExportModal } from './components/ExportModal';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(loadActiveConversationId);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [memories, setMemories] = useState<UserMemory[]>(loadMemories);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingReasoning, setStreamingReasoning] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    if (activeId) saveActiveConversationId(activeId);
  }, [activeId]);

  useEffect(() => {
    saveSettings(settings);
    // Apply theme to document
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    saveMemories(memories);
  }, [memories]);

  // Global Keyboard Shortcuts (Windows & Mac friendly)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N or Ctrl+Shift+O for new chat
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        handleNewChat();
      }

      // Escape to close modals or stop streaming
      if (e.key === 'Escape') {
        if (isStreaming) {
          handleStopGeneration();
        } else if (isSettingsOpen || isMemoryOpen || isExportOpen) {
          setIsSettingsOpen(false);
          setIsMemoryOpen(false);
          setIsExportOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStreaming, isSettingsOpen, isMemoryOpen, isExportOpen]);

  // Auto-scroll during message generation
  useEffect(() => {
    if (settings.autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations, streamingContent]);

  // Active conversation
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeId) || conversations[0] || null;
  }, [conversations, activeId]);

  const activePersona = useMemo(() => {
    return AI_PERSONAS.find((p) => p.id === settings.activePersonaId) || AI_PERSONAS[0];
  }, [settings.activePersonaId]);

  // Handle New Chat creation
  const handleNewChat = () => {
    const newId = `chat-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      personaId: settings.activePersonaId,
      model: settings.provider.model,
      temperature: settings.provider.temperature,
      messages: [],
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newId);
  };

  // Handle Delete Conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        // Create a blank chat if all deleted
        const fallbackId = `chat-${Date.now()}`;
        const fallback: Conversation = {
          id: fallbackId,
          title: 'New Chat',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isPinned: false,
          personaId: settings.activePersonaId,
          model: settings.provider.model,
          temperature: settings.provider.temperature,
          messages: [],
        };
        setActiveId(fallbackId);
        return [fallback];
      }
      if (activeId === id) {
        setActiveId(remaining[0].id);
      }
      return remaining;
    });
  };

  // Handle Rename
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Handle Pin
  const handleTogglePinConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Send message and trigger streaming completion
  const handleSendMessage = async (
    userContent: string,
    attachments: Attachment[] = [],
    customHistory?: Message[]
  ) => {
    if (!activeConversation) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userContent,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const currentMessages = customHistory || activeConversation.messages;
    const updatedMessages = [...currentMessages, userMessage];

    // Auto-generate title for conversation if it's the first message
    const isFirstMessage = currentMessages.length === 0;
    const newTitle =
      isFirstMessage && activeConversation.title === 'New Chat'
        ? userContent.slice(0, 36).trim() || 'Conversation'
        : activeConversation.title;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              title: newTitle,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : c
      )
    );

    // Prepare system prompt with active persona and memories
    let systemPrompt = activePersona.systemPrompt;
    const activeMemories = memories.filter((m) => m.isActive);
    if (activeMemories.length > 0) {
      systemPrompt +=
        '\n\n[User Persistent Preferences & Memory Context]:\n' +
        activeMemories.map((m) => `- ${m.title}: ${m.content}`).join('\n');
    }
    if (settings.customInstructions.trim()) {
      systemPrompt += `\n\n[Custom User Instructions]:\n${settings.customInstructions.trim()}`;
    }

    // Construct message payload for backend
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      })),
    ];

    setIsStreaming(true);
    setStreamingContent('');
    setStreamingReasoning('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedContent = '';
    let accumulatedReasoning = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settings.provider,
          messages: apiMessages,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `HTTP Error ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body stream is unavailable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          if (trimmed === 'data: [DONE]') continue;

          try {
            const dataStr = trimmed.replace(/^data:\s*/, '');
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta;

            if (delta) {
              if (delta.reasoning_content) {
                accumulatedReasoning += delta.reasoning_content;
                setStreamingReasoning(accumulatedReasoning);
              }
              if (delta.content) {
                accumulatedContent += delta.content;
                setStreamingContent(accumulatedContent);
              }
            }
          } catch {
            // Ignore incomplete chunk parse errors
          }
        }
      }

      // Finalize assistant message
      const assistantMessage: Message = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: accumulatedContent || 'No response returned from model.',
        reasoningContent: accumulatedReasoning || undefined,
        timestamp: Date.now(),
        model: settings.provider.model,
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: [...updatedMessages, assistantMessage],
              }
            : c
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User aborted streaming
        if (accumulatedContent.trim()) {
          const stoppedMessage: Message = {
            id: `msg-ai-${Date.now()}`,
            role: 'assistant',
            content: accumulatedContent + ' *(Generation stopped by user)*',
            reasoningContent: accumulatedReasoning || undefined,
            timestamp: Date.now(),
            model: settings.provider.model,
          };
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConversation.id
                ? {
                    ...c,
                    messages: [...updatedMessages, stoppedMessage],
                  }
                : c
            )
          );
        }
      } else {
        // Real error occurred
        console.error('Chat generation error:', err);
        const errorMessage: Message = {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: err.message || 'An error occurred while connecting to the AI provider.',
          timestamp: Date.now(),
          isError: true,
          model: settings.provider.model,
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id
              ? {
                  ...c,
                  messages: [...updatedMessages, errorMessage],
                }
              : c
          )
        );
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      setStreamingReasoning('');
      abortControllerRef.current = null;
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = () => {
    if (!activeConversation || activeConversation.messages.length === 0 || isStreaming) return;
    const msgs = [...activeConversation.messages];
    const lastMsg = msgs[msgs.length - 1];

    if (lastMsg.role === 'assistant') {
      msgs.pop(); // Remove assistant message
      const lastUserMsg = msgs[msgs.length - 1];
      if (lastUserMsg && lastUserMsg.role === 'user') {
        msgs.pop(); // Remove user message and resend it
        handleSendMessage(lastUserMsg.content, lastUserMsg.attachments || [], msgs);
      }
    }
  };

  // Edit user prompt from a message
  const handleEditUserPrompt = (messageId: string, newContent: string) => {
    if (!activeConversation || isStreaming) return;
    const index = activeConversation.messages.findIndex((m) => m.id === messageId);
    if (index === -1) return;

    // Truncate history up to this message
    const previousHistory = activeConversation.messages.slice(0, index);
    const targetMsg = activeConversation.messages[index];
    handleSendMessage(newContent, targetMsg.attachments || [], previousHistory);
  };

  // Continue generation
  const handleContinueGeneration = () => {
    handleSendMessage('Please continue where you left off without repeating yourself.');
  };

  // Starter Prompts for Empty Conversation
  const starterPrompts = [
    {
      icon: Code,
      title: 'Senior Software Architecture',
      description: 'Design a clean, typed TypeScript backend with rate limiting and SSE streaming',
      prompt: 'Architect a clean, typed TypeScript backend service that handles OpenAI-compatible streaming endpoints with rate limiting and SSE error boundaries.',
    },
    {
      icon: Compass,
      title: 'Deep Research & Analysis',
      description: 'Break down trade-offs between local LLMs (Ollama) vs cloud APIs',
      prompt: 'Conduct a thorough architectural comparison between running local LLMs (Ollama, LM Studio) versus Cloud APIs (Groq, OpenAI, Anthropic), analyzing latency, privacy, and operational costs.',
    },
    {
      icon: PenTool,
      title: 'Technical Documentation',
      description: 'Draft a concise engineering RFC for a Bring-Your-Own-Key platform',
      prompt: 'Write a comprehensive RFC specification document for an enterprise Bring-Your-Own-Key (BYOK) AI chatbox system, detailing security guarantees and credential isolation.',
    },
    {
      icon: Cpu,
      title: 'Algorithms & Optimization',
      description: 'Explain transformer self-attention with a visual ASCII breakdown',
      prompt: 'Explain how the self-attention mechanism works in modern Transformer models, including Query, Key, and Value matrices, accompanied by clear ASCII diagrams.',
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 antialiased selection:bg-amber-500/20 selection:text-amber-800 dark:selection:text-amber-200">
      {/* Sidebar Component */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => setActiveId(id)}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePinConversation}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobile={isMobile}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings({ ...settings, ...newSettings })}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onOpenMemoryModal={() => setIsMemoryOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top Navbar Header */}
        <header className="h-14 sm:h-16 px-3 sm:px-6 border-b border-stone-200/80 dark:border-stone-800/80 bg-white/70 dark:bg-stone-950/70 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Toggle Sidebar Button */}
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
                title="Open Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Conversation Title & Persona */}
            <div className="min-w-0 flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                {activeConversation?.title || 'New Chat'}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
                <Sparkles className="w-2.5 h-2.5" />
                {activePersona.name}
              </span>
            </div>
          </div>

          {/* Right Header Toolbar */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Model & Provider Switcher */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-800 transition-colors"
              title="Change Model or Provider Settings"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline font-mono text-[11px] truncate max-w-[120px]">
                {settings.provider.model}
              </span>
              <Sliders className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {/* Export Dialog */}
            <button
              onClick={() => setIsExportOpen(true)}
              disabled={!activeConversation || activeConversation.messages.length === 0}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Export Conversation"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Quick New Chat Button */}
            <button
              onClick={handleNewChat}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="New Chat (Ctrl+N)"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Chat Message Scroll Viewport */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden relative"
        >
          {activeConversation && activeConversation.messages.length > 0 ? (
            <div className="pb-4">
              {activeConversation.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onRegenerate={handleRegenerate}
                  onEditUserPrompt={(newContent) =>
                    handleEditUserPrompt(message.id, newContent)
                  }
                  onContinueGeneration={handleContinueGeneration}
                />
              ))}

              {/* Real-time Streaming Message Placeholder */}
              {isStreaming && (
                <ChatMessage
                  message={{
                    id: 'streaming-active',
                    role: 'assistant',
                    content: streamingContent || '...',
                    reasoningContent: streamingReasoning || undefined,
                    timestamp: Date.now(),
                    model: settings.provider.model,
                  }}
                  isStreaming={true}
                />
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>
          ) : (
            /* Claude-Inspired Empty State */
            <div className="max-w-2xl mx-auto px-4 py-8 sm:py-16 text-center space-y-6">
              <div className="space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2">
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  Ready to assist with your ideas.
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                  Connected to <strong className="text-amber-600 dark:text-amber-400 font-semibold">{settings.provider.name}</strong> ({settings.provider.model}). Enter a prompt below or pick a starter inquiry.
                </p>
              </div>

              {/* Starter Question Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
                {starterPrompts.map((starter, index) => {
                  const Icon = starter.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(starter.prompt)}
                      className="group p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 hover:border-amber-500/50 hover:shadow-md hover:shadow-amber-500/5 transition-all text-left flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Icon className="w-4 h-4 text-amber-500" />
                          <ArrowRight className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                          {starter.title}
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                          {starter.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Input Composer Box */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isStreaming={isStreaming}
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings({ ...settings, ...newSettings })}
          onOpenSettingsModal={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Modals */}
      <ProviderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings({ ...settings, ...newSettings })}
      />

      <MemoryModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        memories={memories}
        onSaveMemories={(updated) => setMemories(updated)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings({ ...settings, ...newSettings })}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        conversation={activeConversation}
      />
    </div>
  );
}
