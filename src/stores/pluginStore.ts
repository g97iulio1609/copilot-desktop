import { create } from 'zustand';
import type { PluginInfo } from '@/types';

interface PluginState {
  installed: PluginInfo[];
  available: PluginInfo[];
  isLoading: boolean;
  searchQuery: string;
  activeTab: 'installed' | 'marketplace';
  setInstalled: (plugins: PluginInfo[]) => void;
  setAvailable: (plugins: PluginInfo[]) => void;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: 'installed' | 'marketplace') => void;
  setLoading: (loading: boolean) => void;
}

export const usePluginStore = create<PluginState>((set) => ({
  installed: [],
  available: [],
  isLoading: false,
  searchQuery: '',
  activeTab: 'installed',

  setInstalled: (installed) => set({ installed }),
  setAvailable: (available) => set({ available }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setLoading: (isLoading) => set({ isLoading }),
}));
