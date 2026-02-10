import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../chatStore';
import type { CopilotMessage } from '@/types';

const makeMsg = (overrides: Partial<CopilotMessage> = {}): CopilotMessage => ({
  id: '1',
  role: 'user',
  content: 'hello',
  timestamp: Date.now(),
  ...overrides,
});

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      messagesPerSession: new Map(),
      isStreaming: false,
      inputValue: '',
    });
  });

  it('addMessage adds a message to a session', () => {
    const msg = makeMsg();
    useChatStore.getState().addMessage('s1', msg);
    const msgs = useChatStore.getState().getSessionMessages('s1');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe('hello');
  });

  it('addMessage appends to existing messages', () => {
    useChatStore.getState().addMessage('s1', makeMsg({ id: '1' }));
    useChatStore.getState().addMessage('s1', makeMsg({ id: '2', content: 'world' }));
    expect(useChatStore.getState().getSessionMessages('s1')).toHaveLength(2);
  });

  it('clearSessionMessages removes all messages for a session', () => {
    useChatStore.getState().addMessage('s1', makeMsg());
    useChatStore.getState().clearSessionMessages('s1');
    expect(useChatStore.getState().getSessionMessages('s1')).toHaveLength(0);
  });

  it('clearSessionMessages does not affect other sessions', () => {
    useChatStore.getState().addMessage('s1', makeMsg());
    useChatStore.getState().addMessage('s2', makeMsg({ id: '2' }));
    useChatStore.getState().clearSessionMessages('s1');
    expect(useChatStore.getState().getSessionMessages('s2')).toHaveLength(1);
  });

  it('setStreaming toggles streaming state', () => {
    expect(useChatStore.getState().isStreaming).toBe(false);
    useChatStore.getState().setStreaming(true);
    expect(useChatStore.getState().isStreaming).toBe(true);
    useChatStore.getState().setStreaming(false);
    expect(useChatStore.getState().isStreaming).toBe(false);
  });

  it('getSessionMessages returns empty array for unknown session', () => {
    expect(useChatStore.getState().getSessionMessages('unknown')).toEqual([]);
  });
});
