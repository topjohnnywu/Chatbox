import React, { useState } from 'react';
import { X, Brain, Plus, Trash2, Check, Sparkles, Lightbulb } from 'lucide-react';
import { UserMemory, AppSettings } from '../types/chat';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: UserMemory[];
  onSaveMemories: (memories: UserMemory[]) => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  onSaveMemories,
  settings,
  onUpdateSettings,
}) => {
  const [instructions, setInstructions] = useState(settings.customInstructions);
  const [memoryList, setMemoryList] = useState<UserMemory[]>(memories);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAddMemory = () => {
    if (!newContent.trim()) return;
    const item: UserMemory = {
      id: `mem-${Date.now()}`,
      title: newTitle.trim() || 'Custom Context',
      content: newContent.trim(),
      isActive: true,
      createdAt: Date.now(),
    };
    const updated = [...memoryList, item];
    setMemoryList(updated);
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
    onSaveMemories(updated);
  };

  const handleToggleActive = (id: string) => {
    const updated = memoryList.map((m) =>
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
    setMemoryList(updated);
    onSaveMemories(updated);
  };

  const handleDeleteMemory = (id: string) => {
    const updated = memoryList.filter((m) => m.id !== id);
    setMemoryList(updated);
    onSaveMemories(updated);
  };

  const handleSaveAll = () => {
    onUpdateSettings({ customInstructions: instructions.trim() });
    onSaveMemories(memoryList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-xl max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-100">
                AI Memory & Custom Instructions
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Persistent context and behavior rules across all chats
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Custom Instructions Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Global System Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Always respond in concise points, prefer TypeScript over JavaScript, assume I am on Windows 11..."
              rows={4}
              className="w-full p-3 rounded-xl text-xs sm:text-sm bg-stone-100 dark:bg-stone-800/70 border border-stone-300/80 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
            />
          </div>

          {/* Memory Snippets List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Saved Context & Preferences ({memoryList.filter((m) => m.isActive).length} Active)
              </label>
              {!isAdding && (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Context
                </button>
              )}
            </div>

            {/* Add Context Form */}
            {isAdding && (
              <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/5 space-y-2.5">
                <input
                  type="text"
                  placeholder="Context Title (e.g. Tech Stack, Location, Tone)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-amber-500"
                />
                <textarea
                  placeholder="Details to remember..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={2}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-amber-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMemory}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-500"
                  >
                    Save Context
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {memoryList.length === 0 ? (
                <p className="text-xs text-stone-400 dark:text-stone-500 italic py-2">
                  No saved context snippets yet. Add details above to help the AI tailor responses to you.
                </p>
              ) : (
                memoryList.map((mem) => (
                  <div
                    key={mem.id}
                    className={`flex items-start justify-between p-3 rounded-xl border transition-all ${
                      mem.isActive
                        ? 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40'
                        : 'border-stone-200/50 dark:border-stone-800/40 opacity-50 bg-stone-100/40 dark:bg-stone-900/40'
                    }`}
                  >
                    <div className="space-y-1 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                          {mem.title}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                            mem.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-stone-200 dark:bg-stone-700 text-stone-400'
                          }`}
                        >
                          {mem.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                        {mem.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(mem.id)}
                        title={mem.isActive ? 'Disable memory' : 'Enable memory'}
                        className={`p-1.5 rounded-lg text-xs font-medium border ${
                          mem.isActive
                            ? 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            : 'border-stone-300 text-stone-400 hover:bg-stone-200'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMemory(mem.id)}
                        title="Delete memory"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-stone-200/60 dark:hover:bg-stone-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
