import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useChatStore } from '@/stores/chatStore';
import { useFileStore } from '@/stores/fileStore';
import { SessionList } from '@/components/session/SessionList';
import { tauriApi } from '@/lib/tauri';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageSquare,
  Pencil,
  Settings,
  Folder,
  ChevronRight,
} from 'lucide-react';
import type { CopilotSession } from '@/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function folderName(cwd: string): string {
  return cwd.replace(/\\/g, '/').split('/').filter(Boolean).pop() || cwd;
}

interface GroupedSessions {
  folder: string;
  cwd: string;
  sessions: CopilotSession[];
}

export function Sidebar() {
  const { setCurrentView } = useSettingsStore();
  const { sessions, activeSessionId, setActiveSession, addSession } = useSessionStore();
  const { setSessionMessages } = useChatStore();
  const { changedFiles } = useFileStore();
  const [copilotSessions, setCopilotSessions] = useState<CopilotSession[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    tauriApi.listCopilotSessions().then(setCopilotSessions).catch(console.error);
  }, []);

  const grouped = useMemo<GroupedSessions[]>(() => {
    const map = new Map<string, CopilotSession[]>();
    for (const cs of copilotSessions) {
      const key = cs.cwd;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(cs);
    }
    return Array.from(map.entries())
      .map(([cwd, sessions]) => ({ folder: folderName(cwd), cwd, sessions }))
      .sort((a, b) => {
        const aTime = a.sessions[0]?.updated_at ?? '';
        const bTime = b.sessions[0]?.updated_at ?? '';
        return bTime.localeCompare(aTime);
      });
  }, [copilotSessions]);

  const toggleFolder = useCallback((cwd: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(cwd)) next.delete(cwd);
      else next.add(cwd);
      return next;
    });
  }, []);

  const loadSessionHistory = useCallback(async (cs: CopilotSession) => {
    const sessionId = crypto.randomUUID();
    const name = cs.summary || folderName(cs.cwd);
    addSession({
      id: sessionId,
      name,
      working_dir: cs.cwd,
      model: null,
      mode: 'suggest' as const,
      created_at: new Date(cs.created_at).getTime(),
      is_active: true,
    });
    setActiveSession(sessionId);
    try {
      const events = await tauriApi.getSessionEvents(cs.id);
      if (events.length > 0) {
        const messages = events
          .filter((e) => e.content.trim().length > 0)
          .map((e) => ({
            id: e.id,
            role: e.role as 'user' | 'assistant',
            content: e.content,
            timestamp: new Date(e.timestamp).getTime(),
          }));
        setSessionMessages(sessionId, messages);
      }
    } catch {
      // History loading is best-effort
    }
  }, [addSession, setActiveSession, setSessionMessages]);

  const handleNewSession = useCallback(() => {
    addSession({
      id: crypto.randomUUID(),
      name: 'New Session',
      working_dir: '~',
      model: null,
      mode: 'suggest' as const,
      created_at: Date.now(),
      is_active: true,
    });
  }, [addSession]);

  const handleOpenSettings = useCallback(() => {
    setCurrentView('settings');
  }, [setCurrentView]);

  return (
    <div className="flex flex-col h-full w-[280px] shrink-0 bg-[#1a1a1a] border-r border-white/[0.06]">
      {/* Drag region for macOS traffic lights */}
      <div data-tauri-drag-region className="h-[38px] shrink-0" />

      {/* New thread button */}
      <div className="px-3 mb-1">
        <button
          onClick={handleNewSession}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-neutral-200 hover:bg-white/[0.06] transition-colors"
        >
          <Pencil size={15} className="text-neutral-400" />
          New thread
        </button>
      </div>

      {/* Settings */}
      <div className="px-3 mb-2">
        <button
          onClick={handleOpenSettings}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06] transition-colors"
        >
          <Settings size={15} />
          Settings
        </button>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-white/[0.06] mb-2" />

      {/* Active sessions */}
      {sessions.length > 0 && (
        <div className="px-3 mb-2">
          <SessionList />
        </div>
      )}

      {/* Threads section */}
      <div className="px-3 mb-1">
        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-3">
          Threads
        </span>
      </div>

      {/* Scrollable session list grouped by folder */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3">
        <div className="space-y-0.5">
          {grouped.map((group) => {
            const isExpanded = expandedFolders.has(group.cwd);
            return (
              <div key={group.cwd}>
                <button
                  onClick={() => toggleFolder(group.cwd)}
                  className="flex items-center gap-1.5 w-full px-3 py-1.5 rounded-lg text-left hover:bg-white/[0.06] text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  <ChevronRight
                    size={12}
                    className={cn('shrink-0 text-neutral-600 transition-transform', isExpanded && 'rotate-90')}
                  />
                  <Folder size={14} className="shrink-0 text-neutral-500" />
                  <span className="text-sm truncate flex-1">{group.folder}</span>
                  <span className="text-[10px] text-neutral-600">{group.sessions.length}</span>
                </button>
                {isExpanded && (
                  <div className="ml-5 space-y-0.5 mt-0.5">
                    {group.sessions.map((cs) => {
                      const isActive = cs.id === activeSessionId;
                      return (
                        <button
                          key={cs.id}
                          onClick={() => loadSessionHistory(cs)}
                          className={cn(
                            'flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-left transition-colors',
                            isActive
                              ? 'bg-white/[0.06] text-white'
                              : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]'
                          )}
                        >
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          )}
                          <MessageSquare size={12} className="shrink-0 text-neutral-600" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[12px] truncate">
                              {cs.summary || 'Session'}
                            </div>
                          </div>
                          <span className="text-[10px] text-neutral-600 whitespace-nowrap">
                            {timeAgo(cs.updated_at)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
