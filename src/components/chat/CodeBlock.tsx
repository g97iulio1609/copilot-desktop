import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, language, showLineNumbers = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const lines = code.split('\n');

  return (
    <div className="group relative rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden my-2">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/50">
        <span className="text-[11px] text-zinc-500 font-mono">
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors',
            copied
              ? 'text-emerald-400'
              : 'text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100'
          )}
        >
          {copied ? (
            <>
              <Check size={12} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <div className="overflow-x-auto">
        <pre className="p-3 text-sm leading-relaxed">
          <code className={language ? `hljs language-${language}` : undefined}>
            {showLineNumbers
              ? lines.map((line, i) => (
                  <span key={i} className="table-row">
                    <span className="table-cell pr-4 text-right text-zinc-600 select-none text-xs w-8">
                      {i + 1}
                    </span>
                    <span className="table-cell">{line}{i < lines.length - 1 ? '\n' : ''}</span>
                  </span>
                ))
              : code}
          </code>
        </pre>
      </div>
    </div>
  );
}
