import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp, Plus } from 'lucide-react';

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
    <div className="p-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative rounded-2xl bg-[#2a2a2a] border border-[#3a3a3a]">
          {/* + button on left */}
          <button
            type="button"
            className="absolute left-3 top-3 p-1 rounded-lg text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <Plus size={18} />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={isStreaming ? 'Thinking...' : 'Ask anything'}
            rows={1}
            className={cn(
              'w-full resize-none bg-transparent',
              'pl-11 pr-12 py-3 text-sm text-neutral-200 placeholder-neutral-500',
              'focus:outline-none',
              'transition-colors',
              isStreaming && 'opacity-60 cursor-not-allowed',
            )}
          />

          {/* Send button on right */}
          <button
            type="submit"
            disabled={!value.trim() || isStreaming}
            className={cn(
              'absolute right-3 top-3',
              'p-1 rounded-full transition-all',
              value.trim() && !isStreaming
                ? 'bg-white text-black hover:bg-neutral-200'
                : 'text-neutral-600',
            )}
          >
            <ArrowUp size={16} />
          </button>
        </div>
        {modelName && (
          <div className="flex justify-end mt-1.5 px-1">
            <span className="text-[11px] text-neutral-600 font-mono">
              {modelName}
            </span>
          </div>
        )}
      </form>
    </div>
  );
}
