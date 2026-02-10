import { create } from 'zustand';
import type { CopilotMessage } from '@/types';

interface ChatState {
  messagesPerSession: Map<string, CopilotMessage[]>;
  isStreaming: boolean;
  inputValue: string;

  getSessionMessages: (sessionId: string) => CopilotMessage[];
  addMessage: (sessionId: string, message: CopilotMessage) => void;
  appendToLastMessage: (sessionId: string, content: string) => void;
  setStreaming: (streaming: boolean) => void;
  setInputValue: (value: string) => void;
  setSessionMessages: (sessionId: string, messages: CopilotMessage[]) => void;
  clearSessionMessages: (sessionId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messagesPerSession: new Map(),
  isStreaming: false,
  inputValue: '',

  getSessionMessages: (sessionId) => {
    return get().messagesPerSession.get(sessionId) ?? [];
  },

  addMessage: (sessionId, message) =>
    set((state) => {
      const map = new Map(state.messagesPerSession);
      const msgs = [...(map.get(sessionId) ?? []), message];
      map.set(sessionId, msgs);
      return { messagesPerSession: map };
    }),

  appendToLastMessage: (sessionId, content) =>
    set((state) => {
      const map = new Map(state.messagesPerSession);
      const msgs = [...(map.get(sessionId) ?? [])];
      const last = msgs[msgs.length - 1];
      if (last?.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + content };
        map.set(sessionId, msgs);
      }
      return { messagesPerSession: map };
    }),

  setStreaming: (isStreaming) => set({ isStreaming }),
  setInputValue: (inputValue) => set({ inputValue }),
  setSessionMessages: (sessionId, messages) =>
    set((state) => {
      const map = new Map(state.messagesPerSession);
      map.set(sessionId, messages);
      return { messagesPerSession: map };
    }),
  clearSessionMessages: (sessionId) =>
    set((state) => {
      const map = new Map(state.messagesPerSession);
      map.delete(sessionId);
      return { messagesPerSession: map };
    }),
}));
