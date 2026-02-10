import { create } from 'zustand';
import type { McpServerConfig } from '@/types';

interface McpState {
  servers: McpServerConfig[];
  selectedServer: string | null;
  isLoading: boolean;
  searchQuery: string;
  setServers: (servers: McpServerConfig[]) => void;
  setSelectedServer: (name: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  addServer: (server: McpServerConfig) => void;
  removeServer: (name: string) => void;
  updateServer: (name: string, server: McpServerConfig) => void;
  toggleServer: (name: string) => void;
}

export const useMcpStore = create<McpState>((set) => ({
  servers: [],
  selectedServer: null,
  isLoading: false,
  searchQuery: '',

  setServers: (servers) => set({ servers }),
  setSelectedServer: (selectedServer) => set({ selectedServer }),
  setLoading: (isLoading) => set({ isLoading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  addServer: (server) =>
    set((state) => ({ servers: [...state.servers, server] })),

  removeServer: (name) =>
    set((state) => ({
      servers: state.servers.filter((s) => s.name !== name),
      selectedServer: state.selectedServer === name ? null : state.selectedServer,
    })),

  updateServer: (name, server) =>
    set((state) => ({
      servers: state.servers.map((s) => (s.name === name ? server : s)),
    })),

  toggleServer: (name) =>
    set((state) => ({
      servers: state.servers.map((s) =>
        s.name === name ? { ...s, enabled: !s.enabled } : s
      ),
    })),
}));
