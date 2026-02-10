import { cn } from '@/lib/utils';
import { useFileStore } from '@/stores/fileStore';
import { Plus, Minus, Equal } from 'lucide-react';
import type { DiffHunk, DiffLine } from '@/types';

function LineNumber({ num }: { num: number | null }) {
  return (
    <span className="inline-block w-10 text-right text-xs text-zinc-600 select-none shrink-0 font-mono pr-2">
      {num ?? ''}
    </span>
  );
}

function DiffLineRow({ line }: { line: DiffLine }) {
  return (
    <div
      className={cn(
        'flex items-stretch font-mono text-xs leading-5 border-b border-zinc-800/30',
        line.line_type === 'add' && 'bg-emerald-500/10',
        line.line_type === 'remove' && 'bg-red-500/10',
        line.line_type === 'context' && 'bg-transparent'
      )}
    >
      <LineNumber num={line.old_line} />
      <LineNumber num={line.new_line} />
      <span
        className={cn(
          'inline-block w-5 text-center shrink-0',
          line.line_type === 'add' && 'text-emerald-500',
          line.line_type === 'remove' && 'text-red-500',
          line.line_type === 'context' && 'text-zinc-600'
        )}
      >
        {line.line_type === 'add' ? '+' : line.line_type === 'remove' ? '-' : ' '}
      </span>
      <span
        className={cn(
          'flex-1 whitespace-pre overflow-x-auto',
          line.line_type === 'add' && 'text-emerald-300',
          line.line_type === 'remove' && 'text-red-300',
          line.line_type === 'context' && 'text-zinc-400'
        )}
      >
        {line.content}
      </span>
    </div>
  );
}

function HunkView({ hunk }: { hunk: DiffHunk }) {
  return (
    <div className="mb-2">
      <div className="bg-zinc-800/60 text-zinc-500 text-xs font-mono px-3 py-1 border-y border-zinc-700/50">
        {hunk.header}
      </div>
      <div>
        {hunk.lines.map((line, i) => (
          <DiffLineRow key={i} line={line} />
        ))}
      </div>
    </div>
  );
}

export function DiffViewer() {
  const { diffResult, selectedFile, loading } = useFileStore();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        Loading diff...
      </div>
    );
  }

  if (!selectedFile || !diffResult) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        Select a file to view changes
      </div>
    );
  }

  const fileName = selectedFile.split('/').pop() ?? selectedFile;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50 shrink-0">
        <span className="text-sm font-medium text-zinc-300 truncate">{fileName}</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <Plus size={12} />
            {diffResult.additions}
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <Minus size={12} />
            {diffResult.deletions}
          </span>
          {diffResult.additions === 0 && diffResult.deletions === 0 && (
            <span className="flex items-center gap-1 text-zinc-500">
              <Equal size={12} />
              No changes
            </span>
          )}
        </div>
      </div>

      {/* File path */}
      <div className="px-4 py-1 text-xs text-zinc-600 border-b border-zinc-800/30 shrink-0 truncate">
        {diffResult.path}
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto">
        {diffResult.hunks.length > 0 ? (
          diffResult.hunks.map((hunk, i) => <HunkView key={i} hunk={hunk} />)
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            No differences found
          </div>
        )}
      </div>
    </div>
  );
}
