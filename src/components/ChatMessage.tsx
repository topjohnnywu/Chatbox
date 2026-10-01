import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCcw,
  Edit3,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  FileText,
  Play,
  AlertTriangle,
} from 'lucide-react';
import { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onEditUserPrompt?: (newContent: string) => void;
  onContinueGeneration?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming = false,
  onRegenerate,
  onEditUserPrompt,
  onContinueGeneration,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState(message.content);
  const [showThinking, setShowThinking] = useState(true);

  // Extract <think> ... </think> reasoning tags if present
  let reasoning = message.reasoningContent || '';
  let cleanContent = message.content;

  if (!reasoning && cleanContent.includes('<think>')) {
    const thinkMatch = cleanContent.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      reasoning = thinkMatch[1].trim();
      cleanContent = cleanContent.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    } else if (cleanContent.startsWith('<think>')) {
      // Still streaming inside <think>
      const parts = cleanContent.split('<think>');
      reasoning = parts[1] || '';
      cleanContent = '';
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editPrompt.trim() && onEditUserPrompt) {
      onEditUserPrompt(editPrompt.trim());
      setIsEditing(false);
    }
  };

  const isUser = message.role === 'user';

  return (
    <div
      className={`group w-full py-4 sm:py-6 transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-stone-50/60 dark:bg-stone-900/40 border-y border-stone-200/50 dark:border-stone-800/40'
      }`}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 flex gap-3 sm:gap-4 items-start">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-200 shadow-xs">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 flex items-center justify-center text-white shadow-xs shadow-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header line: Author & Model / Timestamp */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
                {isUser ? 'You' : 'Nexus Assistant'}
              </span>
              {!isUser && message.model && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200/60 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                  {message.model}
                </span>
              )}
            </div>
            <span className="text-[11px] text-stone-400 dark:text-stone-500">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* User Attachments Preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-2">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs border border-stone-300/50 dark:border-stone-700"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-medium truncate max-w-[150px]">{att.name}</span>
                  <span className="text-[10px] text-stone-400">
                    ({Math.round(att.size / 1024)}KB)
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Thinking / Reasoning Block (DeepSeek / Reasoning models) */}
          {reasoning && (
            <div className="my-2 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/5 overflow-hidden">
              <button
                onClick={() => setShowThinking(!showThinking)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Thought Process</span>
                </div>
                {showThinking ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showThinking && (
                <div className="px-3 pb-3 pt-1 text-xs text-stone-600 dark:text-stone-400 font-mono whitespace-pre-wrap border-t border-amber-500/10 leading-relaxed max-h-60 overflow-y-auto">
                  {reasoning}
                </div>
              )}
            </div>
          )}

          {/* Editing State for User */}
          {isUser && isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="w-full p-2.5 rounded-xl text-xs sm:text-sm bg-stone-100 dark:bg-stone-800 border border-amber-500 focus:outline-none text-stone-900 dark:text-stone-100 resize-none min-h-[80px]"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 text-xs rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-500 text-white"
                >
                  Save & Resend
                </button>
              </div>
            </div>
          ) : (
            /* Rendered Markdown or Text */
            <div
              className={`prose prose-stone dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed ${
                isStreaming ? 'streaming-cursor' : ''
              }`}
            >
              {message.isError ? (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Generation Error</p>
                    <p className="font-mono text-[11px] whitespace-pre-wrap">{cleanContent}</p>
                  </div>
                </div>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Code Block with custom header and copy button
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeText = String(children).replace(/\n$/, '');

                      if (!inline) {
                        return (
                          <CodeBlock
                            code={codeText}
                            language={match ? match[1] : 'text'}
                          />
                        );
                      }
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-amber-700 dark:text-amber-300 font-mono text-[12px]"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    // Responsive Tables for Mobile & Windows
                    table({ children }) {
                      return (
                        <div className="overflow-x-auto my-3 rounded-xl border border-stone-200 dark:border-stone-800">
                          <table className="w-full text-left text-xs border-collapse">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="bg-stone-100 dark:bg-stone-800/80 p-2.5 font-semibold border-b border-stone-200 dark:border-stone-700">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="p-2.5 border-b border-stone-100 dark:border-stone-800/60">
                          {children}
                        </td>
                      );
                    },
                    a({ href, children }) {
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-600 dark:text-amber-400 underline decoration-amber-500/40 hover:decoration-amber-500 transition-all font-medium"
                        >
                          {children}
                        </a>
                      );
                    },
                  }}
                >
                  {cleanContent}
                </ReactMarkdown>
              )}
            </div>
          )}

          {/* Action Toolbar on Bottom */}
          <div className="flex items-center gap-1.5 pt-2 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            {!isUser && (
              <>
                <button
                  onClick={handleCopy}
                  title="Copy response"
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                {onRegenerate && !isStreaming && (
                  <button
                    onClick={onRegenerate}
                    title="Regenerate this response"
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Regenerate</span>
                  </button>
                )}

                {onContinueGeneration && !isStreaming && (
                  <button
                    onClick={onContinueGeneration}
                    title="Continue generation"
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition-colors"
                  >
                    <Play className="w-3 h-3 text-amber-500" />
                    <span>Continue</span>
                  </button>
                )}
              </>
            )}

            {isUser && onEditUserPrompt && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                title="Edit this question"
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Standalone Syntax-Highlighted Code Block
const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden bg-stone-900 border border-stone-800 text-stone-200 shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-stone-950/80 border-b border-stone-800 text-xs">
        <span className="font-mono text-[11px] uppercase tracking-wider text-amber-400 font-semibold">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Code Body with Custom Windows/Mobile Scrollbar */}
      <div className="p-3.5 overflow-x-auto text-[12px] sm:text-[13px] font-mono leading-relaxed">
        <pre className="m-0 p-0">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
