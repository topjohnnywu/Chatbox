import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  X,
  FileText,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { Attachment, AppSettings } from '../types/chat';
import { AI_PERSONAS } from '../lib/presets';

interface ChatInputProps {
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  onStopGeneration: () => void;
  isStreaming: boolean;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onOpenSettingsModal: () => void;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  settings,
  onUpdateSettings,
  onOpenSettingsModal,
  placeholder = 'How can NexusAI assist you today? (Shift+Enter for new line)',
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showTempPopover, setShowTempPopover] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        220
      )}px`;
    }
  }, [content]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (settings.sendShortcut === 'ctrl-enter') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleSend();
        }
      } else {
        // default: enter to send, shift+enter for newline
        if (!e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      }
    }
  };

  const handleSend = () => {
    if ((!content.trim() && attachments.length === 0) || isStreaming) return;
    onSendMessage(content.trim(), attachments);
    setContent('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImg = file.type.startsWith('image/');

      if (isImg) {
        // Read as base64
        const base64 = await readFileAsBase64(file);
        newAttachments.push({
          id: `att-${Date.now()}-${i}`,
          name: file.name,
          type: file.type,
          size: file.size,
          content: base64,
          isImage: true,
        });
      } else {
        // Read as text
        const text = await readFileAsText(file);
        newAttachments.push({
          id: `att-${Date.now()}-${i}`,
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          content: text,
          isImage: false,
        });
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('[Failed to read file]');
      reader.readAsText(file);
    });
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const activePersona = AI_PERSONAS.find((p) => p.id === settings.activePersonaId) || AI_PERSONAS[0];

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-4 sm:pb-6">
      {/* Composer Container */}
      <div className="relative rounded-2xl bg-white dark:bg-stone-900 border border-stone-300/80 dark:border-stone-800 shadow-lg shadow-stone-200/50 dark:shadow-stone-950/50 transition-all focus-within:border-amber-500/80 dark:focus-within:border-amber-500/60 focus-within:ring-2 focus-within:ring-amber-500/20">
        {/* Attachments preview list */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0 border-b border-stone-100 dark:border-stone-800/80">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs border border-stone-200 dark:border-stone-700"
              >
                {att.isImage ? (
                  <img
                    src={att.content}
                    alt={att.name}
                    className="w-5 h-5 rounded object-cover"
                  />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span className="truncate max-w-[130px] font-medium">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-0.5 hover:text-red-500 text-stone-400"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea Input */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="w-full px-3.5 sm:px-4 pt-3.5 pb-2 bg-transparent text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 text-sm sm:text-base resize-none focus:outline-none leading-relaxed min-h-[52px]"
        />

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between px-3 sm:px-3.5 pb-2.5 pt-1">
          {/* Left Controls: File Attachment, Model badge, Persona badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".txt,.md,.json,.js,.ts,.tsx,.jsx,.py,.html,.css,.csv,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach code, text file, or image"
              className="p-2 sm:p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Persona Quick Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200/70 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors border border-stone-200/60 dark:border-stone-700/60"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span className="truncate max-w-[100px] sm:max-w-[140px]">{activePersona.name}</span>
              </button>

              {showPersonaMenu && (
                <div
                  className="absolute bottom-full left-0 mb-2 w-56 p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl z-30"
                  onClick={() => setShowPersonaMenu(false)}
                >
                  <p className="px-2 py-1 text-[10px] uppercase font-semibold text-stone-400">
                    Select AI Persona
                  </p>
                  {AI_PERSONAS.map((persona) => (
                    <button
                      key={persona.id}
                      onClick={() => onUpdateSettings({ activePersonaId: persona.id })}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                        persona.id === settings.activePersonaId
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <span>{persona.name}</span>
                      <span className="text-[10px] text-stone-400">{persona.badge}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Temperature & Model Settings Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTempPopover(!showTempPopover)}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border border-stone-200/50 dark:border-stone-800"
                title="Adjust temperature"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>{settings.provider.temperature}</span>
              </button>

              {showTempPopover && (
                <div className="absolute bottom-full left-0 mb-2 w-64 p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl z-30 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-stone-800 dark:text-stone-200">Temperature</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">
                      {settings.provider.temperature}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.provider.temperature}
                    onChange={(e) =>
                      onUpdateSettings({
                        provider: {
                          ...settings.provider,
                          temperature: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>Precise (0.0)</span>
                    <span>Creative (1.0)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Action: Send or Stop Generation */}
          <div className="flex items-center gap-1">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopGeneration}
                title="Stop generation"
                className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!content.trim() && attachments.length === 0}
                title={
                  settings.sendShortcut === 'ctrl-enter'
                    ? 'Send message (Ctrl+Enter)'
                    : 'Send message (Enter)'
                }
                className="p-2 sm:p-2.5 rounded-xl bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950 font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                <ArrowUp className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Windows / Mobile tip bar */}
      <div className="flex items-center justify-between px-2 pt-1.5 text-[11px] text-stone-400 dark:text-stone-500">
        <span className="truncate">
          Powered by{' '}
          <button
            onClick={onOpenSettingsModal}
            className="hover:text-amber-500 underline underline-offset-2 transition-colors"
          >
            {settings.provider.name} ({settings.provider.model})
          </button>
        </span>
        <span className="hidden sm:inline-block font-mono text-[10px]">
          {settings.sendShortcut === 'ctrl-enter' ? 'Ctrl+Enter to send' : 'Enter to send, Shift+Enter for newline'}
        </span>
      </div>
    </div>
  );
};
