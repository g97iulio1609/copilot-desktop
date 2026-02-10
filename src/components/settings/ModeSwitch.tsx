import { cn } from '@/lib/utils';
import { useSessionStore } from '@/stores/sessionStore';
import { tauriApi } from '@/lib/tauri';
import { Shield, Zap, Rocket } from 'lucide-react';
import type { AgentMode } from '@/types';

const modes: {
  id: AgentMode;
  label: string;
  icon: typeof Shield;
  description: string;
  color: string;
  activeColor: string;
}[] = [
  {
    id: 'suggest',
    label: 'Suggest',
    icon: Shield,
    description: 'Manual approval for each action',
    color: 'text-blue-400',
    activeColor: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
  },
  {
    id: 'autoedit',
    label: 'Auto-edit',
    icon: Zap,
    description: 'Auto-apply file edits',
    color: 'text-amber-400',
    activeColor: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
  },
  {
    id: 'autopilot',
    label: 'Autopilot',
    icon: Rocket,
    description: 'Full autonomous mode',
    color: 'text-red-400',
    activeColor: 'bg-red-500/20 border-red-500/40 text-red-400',
  },
];

export function ModeSwitch() {
  const { sessions, activeSessionId, setSessionMode } = useSessionStore();
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const currentMode = activeSession?.mode ?? 'suggest';

  const handleSelect = async (mode: AgentMode) => {
    if (!activeSessionId || mode === currentMode) return;
    await tauriApi.setMode(activeSessionId, mode).catch(console.error);
    setSessionMode(activeSessionId, mode);
  };

  return (
    <div className="flex items-center bg-zinc-800/40 rounded-lg border border-zinc-700/50 p-0.5">
      {modes.map(({ id, label, icon: Icon, description, activeColor }) => (
        <button
          key={id}
          onClick={() => handleSelect(id)}
          title={description}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all',
            id === currentMode
              ? activeColor + ' border'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
          )}
        >
          <Icon size={12} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
