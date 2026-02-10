import { create } from 'zustand';
import type { CopilotMessage } from '@/types';

interface ChatState {
  messages: CopilotMessage[];
  isStreaming: boolean;
  inputValue: string;
  addMessage: (message: CopilotMessage) => void;
  appendToLastMessage: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
  setInputValue: (value: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  inputValue: '',

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  appendToLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      const last = messages[messages.length - 1];
      if (last?.role === 'assistant') {
        messages[messages.length - 1] = {
          ...last,
          content: last.content + content,
        };
      }
      return { messages };
    }),

  setStreaming: (isStreaming) => set({ isStreaming }),
  setInputValue: (inputValue) => set({ inputValue }),
  clearMessages: () => set({ messages: [] }),
}));
