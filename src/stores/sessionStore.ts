import { create } from 'zustand';
import type { SessionInfo, AgentMode } from '@/types';

interface SessionState {
  sessions: SessionInfo[];
  activeSessionId: string | null;
  setSessions: (sessions: SessionInfo[]) => void;
  addSession: (session: SessionInfo) => void;
  setActiveSession: (id: string) => void;
  removeSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  setSessionModel: (id: string, model: string) => void;
  setSessionMode: (id: string, mode: AgentMode) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  activeSessionId: null,

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) =>
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id,
    })),

  setActiveSession: (activeSessionId) => set({ activeSessionId }),

  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      activeSessionId:
        state.activeSessionId === id ? null : state.activeSessionId,
    })),

  renameSession: (id, name) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, name } : s
      ),
    })),

  setSessionModel: (id, model) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, model } : s
      ),
    })),

  setSessionMode: (id, mode) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, mode } : s
      ),
    })),
}));
