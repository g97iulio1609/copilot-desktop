import { useMemo, useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Bot, User, Copy, Check } from 'lucide-react';
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
          : 'text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100',
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
          <div className="group relative rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden my-2">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/50">
              <span className="text-[11px] text-zinc-500 font-mono">{match[1]}</span>
              <InlineCodeCopyButton code={codeString} />
            </div>
            <div className="overflow-x-auto">
              <pre className="p-3 text-sm leading-relaxed">
                <code className={className}>{children}</code>
              </pre>
            </div>
          </div>
        );
      }

      return (
        <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[13px] font-mono">
          {children}
        </code>
      );
    },
  }), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex gap-3 max-w-3xl',
        isUser ? 'ml-auto flex-row-reverse' : '',
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          isUser
            ? 'bg-blue-600/20 text-blue-400'
            : 'bg-emerald-600/20 text-emerald-400',
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div
          className={cn(
            'rounded-xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-blue-600/15 border border-blue-500/20 text-zinc-200'
              : 'bg-zinc-800/80 border border-zinc-700/30 text-zinc-300',
            // Markdown prose styles
            !isUser && 'prose-sm prose-invert max-w-none',
            !isUser && '[&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5',
            !isUser && '[&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm',
            !isUser && '[&_a]:text-blue-400 [&_a:hover]:underline',
            !isUser && '[&_blockquote]:border-l-2 [&_blockquote]:border-zinc-600 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-400',
            !isUser && '[&_table]:text-xs [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          )}
          {isStreaming && <StreamingIndicator className="mt-2" />}
        </div>
        <span className={cn('text-[11px] text-zinc-600', isUser ? 'text-right' : '')}>
          {timestamp}
        </span>
      </div>
    </motion.div>
  );
}
