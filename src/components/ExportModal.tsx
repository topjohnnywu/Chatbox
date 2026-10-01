import React, { useState } from 'react';
import {
  X,
  Download,
  FileCode,
  FileText,
  Printer,
  Copy,
  Check,
} from 'lucide-react';
import { Conversation } from '../types/chat';
import { exportConversationToMarkdown, downloadFile } from '../lib/storage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  conversation,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !conversation) return null;

  const handleExportMarkdown = () => {
    const md = exportConversationToMarkdown(conversation);
    const cleanTitle = conversation.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadFile(md, `${cleanTitle}.md`, 'text/markdown');
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(conversation, null, 2);
    const cleanTitle = conversation.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadFile(jsonStr, `${cleanTitle}.json`, 'application/json');
  };

  const handleCopyText = () => {
    const md = exportConversationToMarkdown(conversation);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Export Conversation
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-[220px]">
                "{conversation.title}"
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

        {/* Export Options */}
        <div className="p-4 sm:p-5 space-y-2.5">
          <button
            onClick={handleExportMarkdown}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                  Markdown (.md)
                </p>
                <p className="text-[11px] text-stone-500">
                  Formatted for Obsidian, GitHub, Notion, or text editors
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-stone-400 group-hover:text-amber-500" />
          </button>

          <button
            onClick={handleExportJSON}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <FileCode className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                  JSON (.json)
                </p>
                <p className="text-[11px] text-stone-500">
                  Complete structured conversation data & metadata
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-stone-400 group-hover:text-blue-500" />
          </button>

          <button
            onClick={handlePrintPDF}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                  Print to PDF
                </p>
                <p className="text-[11px] text-stone-500">
                  Clean printable document view ready for paper or PDF save
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-stone-400 group-hover:text-purple-500" />
          </button>

          <button
            onClick={handleCopyText}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5 text-stone-500" />
              )}
              <div>
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                  {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
                </p>
                <p className="text-[11px] text-stone-500">
                  Copy formatted markdown text directly
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
