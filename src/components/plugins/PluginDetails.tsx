import { useState } from 'react';
import { cn } from '@/lib/utils';
import { tauriApi } from '@/lib/tauri';
import { useSessionStore } from '@/stores/sessionStore';
import type { PluginInfo } from '@/types';

interface PluginDetailsProps {
  plugin: PluginInfo;
  onClose: () => void;
  onRefresh: () => void;
}

export function PluginDetails({ plugin, onClose, onRefresh }: PluginDetailsProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const activeSession = useSessionStore((s) => s.activeSessionId);

  const handleAction = async (action: 'install' | 'uninstall' | 'update') => {
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
      onClose();
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-lg mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-zinc-100 truncate">
                {plugin.name}
              </h2>
              <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-zinc-700/50 text-zinc-400">
                v{plugin.version}
              </span>
              {plugin.installed && (
                <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                  Installed
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500">{plugin.author}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-4 space-y-4">
          <p className="text-sm text-zinc-300 leading-relaxed">
            {plugin.description}
          </p>

          <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
            {plugin.category && (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {plugin.category}
              </span>
            )}
            <span>Version {plugin.version}</span>
            <span>By {plugin.author}</span>
            {plugin.downloads != null && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                </svg>
                {formatDownloads(plugin.downloads)} downloads
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-800">
          {plugin.update_available && (
            <button
              onClick={() => handleAction('update')}
              disabled={actionLoading !== null}
              className={cn(
                'px-4 py-2 text-sm rounded-lg transition-colors',
                'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30',
                'disabled:opacity-50'
              )}
            >
              {actionLoading === 'update' ? 'Updating...' : 'Update'}
            </button>
          )}
          {plugin.installed ? (
            <button
              onClick={() => handleAction('uninstall')}
              disabled={actionLoading !== null}
              className={cn(
                'px-4 py-2 text-sm rounded-lg transition-colors',
                'bg-red-500/10 text-red-400 hover:bg-red-500/20',
                'disabled:opacity-50'
              )}
            >
              {actionLoading === 'uninstall' ? 'Removing...' : 'Uninstall'}
            </button>
          ) : (
            <button
              onClick={() => handleAction('install')}
              disabled={actionLoading !== null}
              className={cn(
                'px-4 py-2 text-sm rounded-lg transition-colors',
                'bg-blue-500 text-white hover:bg-blue-600',
                'disabled:opacity-50'
              )}
            >
              {actionLoading === 'install' ? 'Installing...' : 'Install'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
