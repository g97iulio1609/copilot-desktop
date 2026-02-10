import { invoke } from '@tauri-apps/api/core';
import type { AuthStatus, CopilotStatus, SessionInfo, AppConfig, FileChangeEvent, DiffResult } from '@/types';

export const tauriApi = {
  checkCopilotStatus: () => invoke<CopilotStatus>('check_copilot_status'),

  checkAuth: () => invoke<AuthStatus>('check_auth'),

  triggerLogin: () => invoke<void>('check_auth'),

  openProject: (path: string, name?: string) =>
    invoke<SessionInfo>('open_project', { path, name }),

  getRecentProjects: () => invoke<string[]>('get_recent_projects'),

  detectCopilotBinary: () => invoke<CopilotStatus>('detect_copilot_binary'),

  createSession: (name: string, workingDir: string) =>
    invoke<SessionInfo>('create_session', { name, workingDir }),

  sendMessage: (sessionId: string, message: string) =>
    invoke<void>('send_message', { sessionId, message }),

  listSessions: () => invoke<SessionInfo[]>('list_sessions'),

  closeSession: (sessionId: string) =>
    invoke<boolean>('close_session', { sessionId }),

  getConfig: () => invoke<AppConfig>('get_config'),

  setTheme: (theme: string) => invoke<void>('set_theme', { theme }),

  listChangedFiles: (sessionId: string) =>
    invoke<FileChangeEvent[]>('list_changed_files', { sessionId }),

  readFile: (path: string) =>
    invoke<string>('read_file', { path }),

  getDiff: (path: string) =>
    invoke<DiffResult>('get_diff', { path }),
};
