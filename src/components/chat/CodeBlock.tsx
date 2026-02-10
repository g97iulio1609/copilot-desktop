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
    <div className="group relative rounded-lg bg-[#0d1117] border border-white/[0.06] overflow-hidden my-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-b border-white/[0.06]">
        <span className="text-[11px] text-zinc-400 font-mono tracking-wide">
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-all duration-150',
            copied
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] opacity-0 group-hover:opacity-100'
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
        <pre className="p-4 text-[13px] leading-relaxed">
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
