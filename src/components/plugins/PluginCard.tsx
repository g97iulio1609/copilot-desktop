import { useState } from 'react';
import { cn } from '@/lib/utils';
import { tauriApi } from '@/lib/tauri';
import { useSessionStore } from '@/stores/sessionStore';
import type { PluginInfo } from '@/types';

interface PluginCardProps {
  plugin: PluginInfo;
  onClick: () => void;
  onRefresh: () => void;
}

export function PluginCard({ plugin, onClick, onRefresh }: PluginCardProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const activeSession = useSessionStore((s) => s.activeSessionId);

  const handleAction = async (
    e: React.MouseEvent,
    action: 'install' | 'uninstall' | 'update'
  ) => {
    e.stopPropagation();
    if (!activeSession) return;
    setActionLoading(action);
    try {
      if (action === 'install') {
        await tauriApi.installPlugin(activeSession, plugin.name);
      } else if (action === 'uninstall') {
        await tauriApi.uninstallPlugin(activeSession, plugin.name);
      } else {
        await tauriApi.updatePlugin(activeSession, plugin.name);
      }
      onRefresh();
    } catch {
      // Error handled silently
    } finally {
      setActionLoading(null);
    }
  };

  const formatDownloads = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left bg-zinc-800/50 border border-zinc-700/30 rounded-xl p-5',
        'hover:border-zinc-600/50 transition-colors cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-100 truncate">
            {plugin.name}
          </h3>
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-400">
            v{plugin.version}
          </span>
        </div>
        {plugin.installed && (
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
            Installed
          </span>
        )}
      </div>

      <p className="text-xs text-zinc-500 mb-3">{plugin.author}</p>

      <p className="text-xs text-zinc-400 line-clamp-2 mb-4">
        {plugin.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {plugin.category && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400">
              {plugin.category}
            </span>
          )}
          {plugin.downloads != null && (
            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3"
                />
              </svg>
              {formatDownloads(plugin.downloads)}
            </span>
          )}
        </div>

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {plugin.update_available && (
            <button
              onClick={(e) => handleAction(e, 'update')}
              disabled={actionLoading !== null}
              className="text-[11px] px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'update' ? '...' : 'Update'}
            </button>
          )}
          {plugin.installed ? (
            <button
              onClick={(e) => handleAction(e, 'uninstall')}
              disabled={actionLoading !== null}
              className="text-[11px] px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'uninstall' ? '...' : 'Uninstall'}
            </button>
          ) : (
            <button
              onClick={(e) => handleAction(e, 'install')}
              disabled={actionLoading !== null}
              className="text-[11px] px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'install' ? '...' : 'Install'}
            </button>
          )}
        </div>
      </div>
    </button>
  );
}
