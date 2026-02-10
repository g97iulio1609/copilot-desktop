import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isStreaming: boolean;
  modelName?: string;
}

const MAX_ROWS = 6;
const LINE_HEIGHT = 20;
const PADDING = 24;

export function InputArea({ value, onChange, onSubmit, isStreaming, modelName }: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = LINE_HEIGHT * MAX_ROWS + PADDING;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.trim() && !isStreaming) onSubmit();
      }
    },
    [value, isStreaming, onSubmit],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (value.trim() && !isStreaming) onSubmit();
    },
    [value, isStreaming, onSubmit],
  );

  return (
    <div className="border-t border-white/[0.06] bg-white/[0.01] p-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={isStreaming ? 'Copilot is thinking...' : 'Ask Copilot anything... (@ to mention files)'}
            rows={1}
            className={cn(
              'w-full resize-none rounded-xl bg-white/[0.04] border border-white/[0.08]',
              'px-4 py-3 pr-12 text-sm text-zinc-200 placeholder-zinc-500',
              'focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20',
              'focus:bg-white/[0.05]',
              'transition-all duration-200',
              isStreaming && 'opacity-60 cursor-not-allowed',
            )}
          />
          <button
            type="submit"
            disabled={!value.trim() || isStreaming}
            className={cn(
              'absolute right-2.5 top-2.5',
              'p-1.5 rounded-lg transition-all duration-200',
              value.trim() && !isStreaming
                ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
                : 'text-zinc-600',
            )}
          >
            <Send size={16} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          {modelName && (
            <span className="text-[11px] text-zinc-500 font-mono">
              {modelName}
            </span>
          )}
          <span className="text-[11px] text-zinc-600 ml-auto">
            Shift+Enter for newline · Enter to send
          </span>
        </div>
      </form>
    </div>
  );
}
