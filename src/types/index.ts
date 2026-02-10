export interface AuthStatus {
  authenticated: boolean;
  username: string | null;
  email: string | null;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export type AgentMode = 'suggest' | 'autoedit' | 'autopilot';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
}

export interface SessionInfo {
  id: string;
  name: string;
  working_dir: string;
  model: string | null;
  mode: AgentMode;
  created_at: number;
  is_active: boolean;
}

export interface CopilotStatus {
  installed: boolean;
  path: string | null;
  version: string | null;
  authenticated: boolean;
}

export interface AppConfig {
  copilot_path: string | null;
  default_model: string | null;
  theme: 'dark' | 'light';
  recent_projects: string[];
}

export type PtyEvent =
  | { type: 'Output'; data: string }
  | { type: 'Error'; data: string }
  | { type: 'Exit'; data: number };

export type AppView = 'chat' | 'settings' | 'mcp' | 'plugins';

export interface FileChangeEvent {
  path: string;
  kind: 'created' | 'modified' | 'deleted';
  timestamp: number;
}

export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
  change_kind?: 'created' | 'modified' | 'deleted';
}

export interface DiffResult {
  path: string;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

export interface DiffLine {
  content: string;
  line_type: 'add' | 'remove' | 'context';
  old_line: number | null;
  new_line: number | null;
}

export interface PluginInfo {
  name: string;
  version: string;
  description: string;
  author: string;
  installed: boolean;
  update_available: boolean;
  category: string | null;
  downloads: number | null;
}

export interface McpServerConfig {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string> | null;
  enabled: boolean;
  status: string | null;
}
