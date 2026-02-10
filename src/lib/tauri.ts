import { invoke } from '@tauri-apps/api/core';
import type { CopilotStatus, SessionInfo, AppConfig } from '@/types';

export const tauriApi = {
  checkCopilotStatus: () => invoke<CopilotStatus>('check_copilot_status'),

  createSession: (name: string, workingDir: string) =>
    invoke<SessionInfo>('create_session', { name, workingDir }),

  sendMessage: (sessionId: string, message: string) =>
    invoke<void>('send_message', { sessionId, message }),

  listSessions: () => invoke<SessionInfo[]>('list_sessions'),

  closeSession: (sessionId: string) =>
    invoke<boolean>('close_session', { sessionId }),

  getConfig: () => invoke<AppConfig>('get_config'),

  setTheme: (theme: string) => invoke<void>('set_theme', { theme }),
};
