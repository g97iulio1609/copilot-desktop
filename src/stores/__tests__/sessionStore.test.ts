import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../sessionStore';
import type { SessionInfo } from '@/types';

const makeSession = (overrides: Partial<SessionInfo> = {}): SessionInfo => ({
  id: 's1',
  name: 'Test Session',
  working_dir: '/tmp',
  model: null,
  mode: 'suggest',
  created_at: Date.now(),
  is_active: false,
  ...overrides,
});

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      sessions: [],
      activeSessionId: null,
    });
  });

  it('addSession adds a session and sets it active', () => {
    const session = makeSession();
    useSessionStore.getState().addSession(session);
    const state = useSessionStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.activeSessionId).toBe('s1');
  });

  it('removeSession removes the session', () => {
    useSessionStore.getState().addSession(makeSession());
    useSessionStore.getState().removeSession('s1');
    expect(useSessionStore.getState().sessions).toHaveLength(0);
  });

  it('removeSession clears activeSessionId if it was active', () => {
    useSessionStore.getState().addSession(makeSession());
    useSessionStore.getState().removeSession('s1');
    expect(useSessionStore.getState().activeSessionId).toBeNull();
  });

  it('removeSession preserves activeSessionId if different session removed', () => {
    useSessionStore.getState().addSession(makeSession({ id: 's1' }));
    useSessionStore.getState().addSession(makeSession({ id: 's2', name: 'Second' }));
    useSessionStore.getState().removeSession('s1');
    expect(useSessionStore.getState().activeSessionId).toBe('s2');
  });

  it('setActiveSession updates the active session', () => {
    useSessionStore.getState().addSession(makeSession({ id: 's1' }));
    useSessionStore.getState().addSession(makeSession({ id: 's2' }));
    useSessionStore.getState().setActiveSession('s1');
    expect(useSessionStore.getState().activeSessionId).toBe('s1');
  });

  it('renameSession updates the session name', () => {
    useSessionStore.getState().addSession(makeSession());
    useSessionStore.getState().renameSession('s1', 'New Name');
    const session = useSessionStore.getState().sessions.find((s) => s.id === 's1');
    expect(session?.name).toBe('New Name');
  });
});
