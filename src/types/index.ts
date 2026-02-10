export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface SessionInfo {
  id: string;
  name: string;
  working_dir: string;
  model: string | null;
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
