import { create } from 'zustand';
import type { AppView, CopilotStatus, AppConfig } from '@/types';

interface SettingsState {
  theme: 'dark' | 'light';
  currentView: AppView;
  sidebarOpen: boolean;
  inspectorOpen: boolean;
  copilotStatus: CopilotStatus | null;
  config: AppConfig;
  setTheme: (theme: 'dark' | 'light') => void;
  setCurrentView: (view: AppView) => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;
  setCopilotStatus: (status: CopilotStatus) => void;
  setConfig: (config: AppConfig) => void;
  updateConfigField: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => void;
}

const defaultConfig: AppConfig = {
  copilot_path: null,
  default_model: null,
  theme: 'dark',
  recent_projects: [],
  font_size: 14,
  font_family: 'SF Mono',
  show_line_numbers: true,
  auto_scroll: true,
  send_on_enter: true,
  notification_sound: false,
  accent_color: 'blue',
};

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'dark',
  currentView: 'chat',
  sidebarOpen: true,
  inspectorOpen: false,
  copilotStatus: null,
  config: defaultConfig,

  setTheme: (theme) => set({ theme }),
  setCurrentView: (currentView) => set({ currentView }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleInspector: () =>
    set((state) => ({ inspectorOpen: !state.inspectorOpen })),
  setCopilotStatus: (copilotStatus) => set({ copilotStatus }),
  setConfig: (config) => set({ config, theme: config.theme as 'dark' | 'light' }),
  updateConfigField: (key, value) =>
    set((state) => ({
      config: { ...state.config, [key]: value },
    })),
}));
