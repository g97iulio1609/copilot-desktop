import { create } from 'zustand';
import type { AuthStatus } from '@/types';
import { tauriApi } from '@/lib/tauri';

interface AuthState {
  status: AuthStatus | null;
  isCheckingAuth: boolean;
  setStatus: (status: AuthStatus) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: null,
  isCheckingAuth: false,

  setStatus: (status) => set({ status }),

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const status = await tauriApi.checkAuth();
      set({ status, isCheckingAuth: false });
    } catch (err) {
      console.error('Failed to check auth:', err);
      set({
        status: { authenticated: false, username: null, email: null },
        isCheckingAuth: false,
      });
    }
  },
}));
