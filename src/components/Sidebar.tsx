import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  Brain,
  Download,
  Moon,
  Sun,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { Conversation, AppSettings } from '../types/chat';
import { AI_PERSONAS } from '../lib/presets';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  isMobile: boolean;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onOpenSettingsModal: () => void;
  onOpenMemoryModal: () => void;
  onOpenExportModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  isOpen,
  onToggleOpen,
  isMobile,
  settings,
  onUpdateSettings,
  onOpenSettingsModal,
  onOpenMemoryModal,
  onOpenExportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Group conversations by Pin and relative dates
  const groupedConversations = useMemo(() => {
    const filtered = conversations.filter((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pinned: Conversation[] = [];
    const today: Conversation[] = [];
    const previous7Days: Conversation[] = [];
    const older: Conversation[] = [];

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    filtered.forEach((conv) => {
      if (conv.isPinned) {
        pinned.push(conv);
        return;
      }

      const diff = now - conv.updatedAt;
      if (diff < oneDay) {
        today.push(conv);
      } else if (diff < sevenDays) {
        previous7Days.push(conv);
      } else {
        older.push(conv);
      }
    });

    return { pinned, today, previous7Days, older };
  }, [conversations, searchQuery]);

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e?: React.FormEvent) => {
    e?.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleConfirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(id);
    setDeletingId(null);
  };

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    onUpdateSettings({ theme: nextTheme });
  };

  const currentPersona = AI_PERSONAS.find((p) => p.id === settings.activePersonaId) || AI_PERSONAS[0];

  // Render conversation item
  const renderItem = (conv: Conversation) => {
    const isActive = conv.id === activeId;
    const isEditing = conv.id === editingId;
    const isPendingDelete = conv.id === deletingId;

    return (
      <div
        key={conv.id}
        onClick={() => {
          onSelectConversation(conv.id);
          if (isMobile) onToggleOpen();
        }}
        className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all duration-150 ${
          isActive
            ? 'bg-amber-500/15 text-amber-900 dark:text-amber-100 font-medium border border-amber-500/20'
            : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/60'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare
            className={`w-4 h-4 shrink-0 ${
              isActive ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'
            }`}
          />
          {isEditing ? (
            <form
              onSubmit={(e) => handleSaveRename(conv.id, e)}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 w-full"
            >
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                autoFocus
                className="w-full bg-white dark:bg-stone-900 px-2 py-0.5 rounded text-xs border border-amber-500 focus:outline-none text-stone-900 dark:text-stone-100"
              />
              <button
                type="submit"
                className="p-1 hover:text-green-600 text-stone-500"
                title="Save (Enter)"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="p-1 hover:text-red-500 text-stone-500"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <span className="truncate text-xs sm:text-sm">{conv.title}</span>
          )}
        </div>

        {/* Action icons */}
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:transition-opacity shrink-0">
            {isPendingDelete ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 bg-red-50 dark:bg-red-950/80 px-1.5 py-0.5 rounded border border-red-300 dark:border-red-800"
              >
                <span className="text-[10px] text-red-600 dark:text-red-300 font-medium">Delete?</span>
                <button
                  onClick={(e) => handleConfirmDelete(conv.id, e)}
                  className="p-0.5 hover:text-red-600 text-stone-500"
                  title="Confirm Delete"
                >
                  <Check className="w-3 h-3 text-red-600 dark:text-red-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingId(null);
                  }}
                  className="p-0.5 hover:text-stone-700 text-stone-500"
                  title="Cancel"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePinConversation(conv.id);
                  }}
                  title={conv.isPinned ? 'Unpin' : 'Pin conversation'}
                  className={`p-1 rounded hover:bg-stone-300/60 dark:hover:bg-stone-700/60 ${
                    conv.isPinned ? 'text-amber-500 opacity-100' : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleStartRename(conv, e)}
                  title="Rename"
                  className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-300/60 dark:hover:bg-stone-700/60"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingId(conv.id);
                  }}
                  title="Delete chat"
                  className="p-1 rounded text-stone-400 hover:text-red-500 hover:bg-stone-300/60 dark:hover:bg-stone-700/60"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div
          onClick={onToggleOpen}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 sm:w-80 bg-stone-100/95 dark:bg-stone-900/95 border-r border-stone-200 dark:border-stone-800 backdrop-blur-md transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:-ml-80'
        }`}
      >
        {/* Header: Logo & New Chat */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 flex items-center justify-center text-white shadow-sm shadow-amber-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-stone-900 dark:text-white flex items-center gap-1.5">
                  NexusAI
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Pro
                  </span>
                </h1>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">Claude-inspired BYOK Chat</p>
              </div>
            </div>

            {/* Desktop collapse or mobile close */}
            <button
              onClick={onToggleOpen}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
              title="Close sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Primary Button */}
          <button
            onClick={() => {
              onNewChat();
              if (isMobile) onToggleOpen();
            }}
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-stone-900 text-stone-50 dark:bg-amber-500 dark:text-stone-950 font-medium text-sm hover:opacity-90 active:scale-[0.99] transition-all shadow-sm group"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400 dark:text-stone-950 group-hover:rotate-90 transition-transform duration-200" />
              New Chat
            </span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono uppercase bg-stone-800 dark:bg-amber-600/60 px-1.5 py-0.5 rounded text-stone-300 dark:text-stone-900">
              Ctrl+N
            </kbd>
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search chats (Ctrl+K)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-200/60 dark:bg-stone-800/60 border border-transparent focus:border-amber-500/50 rounded-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {/* Pinned section */}
          {groupedConversations.pinned.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Pin className="w-3 h-3" />
                Pinned
              </div>
              {groupedConversations.pinned.map(renderItem)}
            </div>
          )}

          {/* Today */}
          {groupedConversations.today.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Today
              </div>
              {groupedConversations.today.map(renderItem)}
            </div>
          )}

          {/* Previous 7 Days */}
          {groupedConversations.previous7Days.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Previous 7 Days
              </div>
              {groupedConversations.previous7Days.map(renderItem)}
            </div>
          )}

          {/* Older */}
          {groupedConversations.older.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Older
              </div>
              {groupedConversations.older.map(renderItem)}
            </div>
          )}

          {conversations.length === 0 && (
            <div className="text-center py-8 text-xs text-stone-400 dark:text-stone-600">
              No conversations yet. Start one above!
            </div>
          )}
        </div>

        {/* Footer: Active Persona & Bottom Controls */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/50 space-y-2">
          {/* Active Provider Status Badge */}
          <div
            onClick={onOpenSettingsModal}
            className="flex items-center justify-between p-2 rounded-xl bg-stone-200/50 dark:bg-stone-800/50 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer border border-stone-300/40 dark:border-stone-700/40 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="truncate">
                <p className="text-xs font-medium text-stone-900 dark:text-stone-200 truncate">
                  {settings.provider.name}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                  {settings.provider.model}
                </p>
              </div>
            </div>
            <Sliders className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          </div>

          {/* Quick Action Toolbar */}
          <div className="grid grid-cols-4 gap-1 pt-1">
            <button
              onClick={onOpenSettingsModal}
              title="Provider & Model Settings"
              className="flex flex-col items-center justify-center p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/80 dark:hover:bg-stone-800/80 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-[9px] mt-1">API Key</span>
            </button>

            <button
              onClick={onOpenMemoryModal}
              title="Memory & Custom Instructions"
              className="flex flex-col items-center justify-center p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/80 dark:hover:bg-stone-800/80 transition-colors"
            >
              <Brain className="w-4 h-4" />
              <span className="text-[9px] mt-1">Memory</span>
            </button>

            <button
              onClick={onOpenExportModal}
              title="Export Conversation (Markdown, JSON, PDF)"
              className="flex flex-col items-center justify-center p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/80 dark:hover:bg-stone-800/80 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-[9px] mt-1">Export</span>
            </button>

            <button
              onClick={toggleTheme}
              title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="flex flex-col items-center justify-center p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/80 dark:hover:bg-stone-800/80 transition-colors"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-stone-600" />
              )}
              <span className="text-[9px] mt-1">{settings.theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
