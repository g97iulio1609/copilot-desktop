import { cn } from '@/lib/utils';
import { useSessionStore } from '@/stores/sessionStore';
import { ModelSelector } from '@/components/settings/ModelSelector';
import { ModeSwitch } from '@/components/settings/ModeSwitch';
import { Folder } from 'lucide-react';

export function Toolbar() {
  const { sessions, activeSessionId } = useSessionStore();
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  if (!activeSession) return null;

  const dirName = activeSession.working_dir.split('/').pop() || activeSession.working_dir;

  return (
    <div
      className={cn(
        'flex items-center gap-3 h-10 px-4',
        'bg-zinc-900/80 border-b border-zinc-800',
        'select-none'
      )}
    >
      <ModelSelector />

      <div className="w-px h-5 bg-zinc-800" />

      <ModeSwitch />

      <div className="w-px h-5 bg-zinc-800" />

      <div className="flex items-center gap-1.5 text-xs text-zinc-500 min-w-0">
        <Folder size={12} className="shrink-0" />
        <span className="truncate" title={activeSession.working_dir}>
          {dirName}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-[10px] text-zinc-600 font-medium">
          {activeSession.mode === 'suggest' ? '🛡️' : activeSession.mode === 'autoedit' ? '⚡' : '🚀'}
        </span>
      </div>
    </div>
  );
}
