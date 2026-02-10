import { invoke } from '@tauri-apps/api/core';
import type { AuthStatus, CopilotStatus, SessionInfo, AppConfig, FileChangeEvent, DiffResult, McpServerConfig, ModelInfo, AgentMode, PluginInfo, UsageMetrics } from '@/types';

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

  listMcpServers: () =>
    invoke<McpServerConfig[]>('list_mcp_servers'),

  addMcpServer: (config: McpServerConfig) =>
    invoke<void>('add_mcp_server', { config }),

  updateMcpServer: (name: string, config: McpServerConfig) =>
    invoke<void>('update_mcp_server', { name, config }),

  deleteMcpServer: (name: string) =>
    invoke<void>('delete_mcp_server', { name }),

  toggleMcpServer: (name: string, enabled: boolean) =>
    invoke<void>('toggle_mcp_server', { name, enabled }),

  renameSession: (sessionId: string, name: string) =>
    invoke<void>('rename_session', { sessionId, name }),

  getSession: (sessionId: string) =>
    invoke<SessionInfo>('get_session', { sessionId }),

  setModel: (sessionId: string, model: string) =>
    invoke<void>('set_model', { sessionId, model }),

  setMode: (sessionId: string, mode: AgentMode) =>
    invoke<void>('set_mode', { sessionId, mode }),

  listAvailableModels: () =>
    invoke<ModelInfo[]>('list_available_models'),

  sendSlashCommand: (sessionId: string, command: string) =>
    invoke<void>('send_slash_command', { sessionId, command }),

  listInstalledPlugins: () =>
    invoke<PluginInfo[]>('list_installed_plugins'),

  listAvailablePlugins: () =>
    invoke<PluginInfo[]>('list_available_plugins'),

  installPlugin: (sessionId: string, name: string) =>
    invoke<void>('install_plugin', { sessionId, name }),

  uninstallPlugin: (sessionId: string, name: string) =>
    invoke<void>('uninstall_plugin', { sessionId, name }),

  updatePlugin: (sessionId: string, name: string) =>
    invoke<void>('update_plugin', { sessionId, name }),

  updateConfig: (config: AppConfig) =>
    invoke<void>('update_config', { config }),

  getUsageMetrics: (sessionId: string) =>
    invoke<UsageMetrics>('get_usage_metrics', { sessionId }),

  clearSessionHistory: (sessionId: string) =>
    invoke<void>('clear_session_history', { sessionId }),
};
