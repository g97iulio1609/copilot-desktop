import { cn } from '@/lib/utils';
import { useSessionStore } from '@/stores/sessionStore';
import { tauriApi } from '@/lib/tauri';
import { Plus, X } from 'lucide-react';

export function SessionTabs() {
  const { sessions, activeSessionId, setActiveSession, removeSession } =
    useSessionStore();

  const handleClose = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await tauriApi.closeSession(id).catch(console.error);
    removeSession(id);
  };

  if (sessions.length <= 1) return null;

  return (
    <div className="flex items-center h-9 bg-zinc-950/60 border-b border-zinc-800/50 overflow-x-auto scrollbar-hide">
      <div className="flex items-center min-w-0">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setActiveSession(session.id)}
            className={cn(
              'group flex items-center gap-1.5 px-3 h-9 text-xs font-medium',
              'border-r border-zinc-800/50 transition-colors whitespace-nowrap',
              'min-w-[100px] max-w-[180px]',
              session.id === activeSessionId
                ? 'bg-zinc-900 text-zinc-200 border-b-2 border-b-blue-500'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 border-b-2 border-b-transparent'
            )}
          >
            <span className="truncate">{session.name}</span>
            <span
              onClick={(e) => handleClose(e, session.id)}
              className={cn(
                'shrink-0 p-0.5 rounded hover:bg-zinc-700 transition-all',
                session.id === activeSessionId
                  ? 'opacity-60 hover:opacity-100'
                  : 'opacity-0 group-hover:opacity-60 hover:!opacity-100'
              )}
            >
              <X size={12} />
            </span>
          </button>
        ))}
      </div>
      <button
        className="shrink-0 p-1.5 mx-1 rounded hover:bg-zinc-800 text-zinc-600 hover:text-zinc-400 transition-colors"
        title="New Session"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
