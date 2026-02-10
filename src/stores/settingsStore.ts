import { create } from 'zustand';
import type { AppView, CopilotStatus } from '@/types';

interface SettingsState {
  theme: 'dark' | 'light';
  currentView: AppView;
  sidebarOpen: boolean;
  inspectorOpen: boolean;
  copilotStatus: CopilotStatus | null;
  setTheme: (theme: 'dark' | 'light') => void;
  setCurrentView: (view: AppView) => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;
  setCopilotStatus: (status: CopilotStatus) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'dark',
  currentView: 'chat',
  sidebarOpen: true,
  inspectorOpen: false,
  copilotStatus: null,

  setTheme: (theme) => set({ theme }),
  setCurrentView: (currentView) => set({ currentView }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleInspector: () =>
    set((state) => ({ inspectorOpen: !state.inspectorOpen })),
  setCopilotStatus: (copilotStatus) => set({ copilotStatus }),
}));
