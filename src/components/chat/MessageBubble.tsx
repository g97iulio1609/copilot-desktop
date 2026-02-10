import { useMemo, useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';
import { StreamingIndicator } from './StreamingIndicator';
import type { CopilotMessage } from '@/types';
import type { Components } from 'react-markdown';

interface MessageBubbleProps {
  message: CopilotMessage;
  isStreaming?: boolean;
}

function InlineCodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);
  return (
    <button
      onClick={handleCopy}
      className={cn(
        'flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors',
        copied
          ? 'text-emerald-400'
          : 'text-neutral-500 hover:text-neutral-300 opacity-0 group-hover:opacity-100',
      )}
    >
      {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
    </button>
  );
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const timestamp = useMemo(() => {
    const d = new Date(message.timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [message.timestamp]);

  const markdownComponents = useMemo<Components>(() => ({
    pre({ children }) {
      return <>{children}</>;
    },
    code({ className, children }) {
      const match = /language-(\w+)/.exec(className ?? '');
      const codeString = String(children).replace(/\n$/, '');

      if (match) {
        return (
          <div className="group relative rounded-lg bg-[#0d0d0d] border border-white/[0.06] overflow-hidden my-3">
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-b border-white/[0.06]">
              <span className="text-[11px] text-neutral-500 font-mono tracking-wide">{match[1]}</span>
              <InlineCodeCopyButton code={codeString} />
            </div>
            <div className="overflow-x-auto">
              <pre className="p-4 text-[13px] leading-relaxed">
                <code className={className}>{children}</code>
              </pre>
            </div>
          </div>
        );
      }

      return (
        <code className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-emerald-300 text-[13px] font-mono border border-white/[0.04]">
          {children}
        </code>
      );
    },
  }), []);

  return (
    <div className="animate-message-in">
      {isUser ? (
        <div className="flex flex-col gap-1">
          <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed bg-[#2a2a2a] text-neutral-200">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <span className="text-[11px] text-neutral-600 text-right">{timestamp}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <div
            className={cn(
              'text-sm leading-relaxed text-neutral-300',
              'prose-sm prose-invert max-w-none',
              '[&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5',
              '[&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold',
              '[&_a]:text-blue-400 [&_a:hover]:underline',
              '[&_blockquote]:border-l-2 [&_blockquote]:border-neutral-600 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-400',
              '[&_table]:text-xs [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1',
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
            {isStreaming && <StreamingIndicator className="mt-2" />}
          </div>
          <span className="text-[11px] text-neutral-600">{timestamp}</span>
        </div>
      )}
    </div>
  );
}
