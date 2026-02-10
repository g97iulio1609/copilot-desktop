import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useFileStore } from '@/stores/fileStore';
import { FileTree } from '@/components/files/FileTree';
import {
  MessageSquare,
  Plus,
  Settings,
  Puzzle,
  Server,
  ChevronLeft,
  GitCompare,
} from 'lucide-react';
import type { AppView } from '@/types';

const navItems: { id: AppView; icon: typeof MessageSquare; label: string }[] = [
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'mcp', icon: Server, label: 'MCP' },
  { id: 'plugins', icon: Puzzle, label: 'Plugins' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { currentView, setCurrentView, sidebarOpen, toggleSidebar, toggleInspector } =
    useSettingsStore();
  const { sessions, activeSessionId, setActiveSession } = useSessionStore();
  const { changedFiles } = useFileStore();

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-zinc-950/90 border-r border-zinc-800/50',
        'transition-all duration-200',
        sidebarOpen ? 'w-64' : 'w-14'
      )}
    >
      {/* Collapse toggle */}
      <div className="flex items-center justify-between p-3">
        {sidebarOpen && (
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Navigation
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ChevronLeft
            size={16}
            className={cn(
              'transition-transform',
              !sidebarOpen && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* New session button */}
      <div className="px-2 mb-2">
        <button
          className={cn(
            'flex items-center gap-2 w-full rounded-lg',
            'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400',
            'transition-colors',
            sidebarOpen ? 'px-3 py-2' : 'justify-center py-2'
          )}
        >
          <Plus size={16} />
          {sidebarOpen && <span className="text-sm font-medium">New Session</span>}
        </button>
      </div>

      {/* Sessions list */}
      {sidebarOpen && sessions.length > 0 && (
        <div className="px-2 mb-4 overflow-y-auto">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2">
            Sessions
          </span>
          <div className="mt-1 space-y-0.5">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-sm',
                  'transition-colors truncate',
                  session.id === activeSessionId
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                )}
              >
                <MessageSquare size={14} className="shrink-0" />
                <span className="truncate">{session.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Files section */}
      {sidebarOpen && changedFiles.length > 0 && (
        <div className="px-2 mb-4">
          <button
            onClick={toggleInspector}
            className="flex items-center gap-1.5 px-2 py-1 mb-1 w-full text-left rounded-md hover:bg-zinc-800/50 transition-colors group"
          >
            <GitCompare size={14} className="text-zinc-500 group-hover:text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider group-hover:text-zinc-400">
              Changed Files
            </span>
            <span className="ml-auto text-xs bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded-full font-medium">
              {changedFiles.length}
            </span>
          </button>
          <FileTree />
        </div>
      )}

      {/* Navigation */}
      <div className="mt-auto px-2 pb-3 space-y-0.5">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setCurrentView(id)}
            className={cn(
              'flex items-center gap-3 w-full rounded-lg transition-colors',
              sidebarOpen ? 'px-3 py-2' : 'justify-center py-2',
              currentView === id
                ? 'bg-zinc-800 text-zinc-200'
                : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
            )}
          >
            <Icon size={18} />
            {sidebarOpen && <span className="text-sm">{label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
