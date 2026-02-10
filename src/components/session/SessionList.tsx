import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/stores/sessionStore';
import { tauriApi } from '@/lib/tauri';
import {
  MessageSquare,
  Plus,
  MoreHorizontal,
  Pencil,
  X,
  FolderOpen,
  MessageCircle,
} from 'lucide-react';

export function SessionList() {
  const { sessions, activeSessionId, setActiveSession, removeSession, renameSession } =
    useSessionStore();
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
    setContextMenu(null);
  };

  const submitRename = async (id: string) => {
    if (editName.trim()) {
      await tauriApi.renameSession(id, editName.trim()).catch(console.error);
      renameSession(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleClose = async (id: string) => {
    setContextMenu(null);
    await tauriApi.closeSession(id).catch(console.error);
    removeSession(id);
  };

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center mb-3">
          <MessageCircle size={24} className="text-zinc-600" />
        </div>
        <p className="text-sm text-zinc-500">No sessions yet</p>
        <p className="text-xs text-zinc-600 mt-1">Open a project to start</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 relative">
      {sessions.map((session) => (
        <div
          key={session.id}
          onContextMenu={(e) => handleContextMenu(e, session.id)}
          onDoubleClick={() => startRename(session.id, session.name)}
          onClick={() => setActiveSession(session.id)}
          className={cn(
            'group flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm',
            'transition-colors cursor-pointer',
            session.id === activeSessionId
              ? 'bg-zinc-800 text-zinc-200 border border-blue-500/30'
              : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300 border border-transparent'
          )}
        >
          <MessageSquare size={14} className="shrink-0 text-zinc-500" />
          <div className="flex-1 min-w-0">
            {editingId === session.id ? (
              <input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => submitRename(session.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename(session.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="w-full bg-zinc-700 text-zinc-200 text-sm px-1.5 py-0.5 rounded border border-zinc-600 outline-none focus:border-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <p className="truncate">{session.name}</p>
                <p className="text-xs text-zinc-600 truncate">
                  {session.working_dir.split('/').pop()}
                  {session.model && (
                    <span className="ml-1.5 text-zinc-500">· {session.model}</span>
                  )}
                </p>
              </>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, session.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-zinc-700 transition-all"
          >
            <MoreHorizontal size={14} className="text-zinc-500" />
          </button>
        </div>
      ))}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[160px] bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const s = sessions.find((s) => s.id === contextMenu.id);
              if (s) startRename(s.id, s.name);
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            <Pencil size={14} />
            Rename
          </button>
          <button
            onClick={() => handleClose(contextMenu.id)}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-400 hover:bg-zinc-700 transition-colors"
          >
            <X size={14} />
            Close Session
          </button>
          <button
            onClick={() => setContextMenu(null)}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            <FolderOpen size={14} />
            Open Folder
          </button>
        </div>
      )}
    </div>
  );
}
