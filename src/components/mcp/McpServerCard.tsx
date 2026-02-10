import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { McpServerConfig } from '@/types';

interface McpServerCardProps {
  server: McpServerConfig;
  onEdit: (server: McpServerConfig) => void;
  onDelete: (name: string) => void;
  onToggle: (name: string, enabled: boolean) => void;
}

export function McpServerCard({ server, onEdit, onDelete, onToggle }: McpServerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const statusColor = {
    running: 'bg-green-500/20 text-green-400',
    stopped: 'bg-zinc-600/20 text-zinc-400',
    error: 'bg-red-500/20 text-red-400',
  };

  const statusLabel = server.status ?? (server.enabled ? 'stopped' : 'stopped');
  const colorClass = statusColor[statusLabel as keyof typeof statusColor] ?? statusColor.stopped;

  const envEntries = server.env ? Object.entries(server.env) : [];

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-colors',
        'bg-zinc-800/50 border-zinc-700/30',
        'hover:border-zinc-600/50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-zinc-100 truncate">{server.name}</span>
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', colorClass)}>
              {statusLabel}
            </span>
          </div>
          <p className="text-sm font-mono text-zinc-400 truncate">{server.command}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle switch */}
          <button
            onClick={() => onToggle(server.name, !server.enabled)}
            className={cn(
              'relative w-9 h-5 rounded-full transition-colors',
              server.enabled ? 'bg-blue-600' : 'bg-zinc-600'
            )}
            title={server.enabled ? 'Disable' : 'Enable'}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                server.enabled && 'translate-x-4'
              )}
            />
          </button>

          {/* Menu button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 w-36 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl py-1">
                <button
                  onClick={() => { onEdit(server); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700/50"
                >
                  Edit
                </button>
                <button
                  onClick={() => { onDelete(server.name); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-zinc-700/50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-zinc-700/30 space-y-2">
          {server.args.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Arguments</p>
              <div className="flex flex-wrap gap-1">
                {server.args.map((arg, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-zinc-700/50 text-xs font-mono text-zinc-300"
                  >
                    {arg}
                  </span>
                ))}
              </div>
            </div>
          )}

          {envEntries.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Environment</p>
              <div className="space-y-0.5">
                {envEntries.map(([key, value]) => (
                  <p key={key} className="text-xs font-mono text-zinc-400">
                    <span className="text-zinc-300">{key}</span>={value}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
