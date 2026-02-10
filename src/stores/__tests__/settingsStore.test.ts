import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      theme: 'dark',
      currentView: 'chat',
      sidebarOpen: true,
      inspectorOpen: false,
      copilotStatus: null,
      config: {
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
      },
    });
  });

  it('setTheme switches theme', () => {
    useSettingsStore.getState().setTheme('light');
    expect(useSettingsStore.getState().theme).toBe('light');
    useSettingsStore.getState().setTheme('dark');
    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  it('toggleSidebar toggles sidebar state', () => {
    expect(useSettingsStore.getState().sidebarOpen).toBe(true);
    useSettingsStore.getState().toggleSidebar();
    expect(useSettingsStore.getState().sidebarOpen).toBe(false);
    useSettingsStore.getState().toggleSidebar();
    expect(useSettingsStore.getState().sidebarOpen).toBe(true);
  });

  it('updateConfigField updates a single field', () => {
    useSettingsStore.getState().updateConfigField('font_size', 18);
    expect(useSettingsStore.getState().config.font_size).toBe(18);
  });

  it('updateConfigField does not affect other fields', () => {
    useSettingsStore.getState().updateConfigField('font_size', 18);
    expect(useSettingsStore.getState().config.font_family).toBe('SF Mono');
  });

  it('setConfig replaces config and syncs theme', () => {
    const newConfig = {
      ...useSettingsStore.getState().config,
      theme: 'light' as const,
      font_size: 20,
    };
    useSettingsStore.getState().setConfig(newConfig);
    expect(useSettingsStore.getState().config.font_size).toBe(20);
    expect(useSettingsStore.getState().theme).toBe('light');
  });

  it('setCurrentView changes the view', () => {
    useSettingsStore.getState().setCurrentView('settings');
    expect(useSettingsStore.getState().currentView).toBe('settings');
  });
});
