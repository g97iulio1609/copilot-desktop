import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { tauriApi } from '@/lib/tauri';
import { useSessionStore } from '@/stores/sessionStore';

export function useAuth() {
  const { status, isCheckingAuth, checkAuth, setStatus } = useAuthStore();
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async () => {
    if (!activeSessionId) return;
    try {
      // Send /login command to the active PTY session
      await tauriApi.sendMessage(activeSessionId, '/login');
      // Poll for auth status change
      const pollInterval = setInterval(async () => {
        const newStatus = await tauriApi.checkAuth();
        if (newStatus.authenticated) {
          setStatus(newStatus);
          clearInterval(pollInterval);
        }
      }, 2000);
      // Stop polling after 2 minutes
      setTimeout(() => clearInterval(pollInterval), 120_000);
    } catch (err) {
      console.error('Login failed:', err);
    }
  }, [activeSessionId, setStatus]);

  const logout = useCallback(async () => {
    if (!activeSessionId) return;
    try {
      await tauriApi.sendMessage(activeSessionId, '/logout');
      setStatus({ authenticated: false, username: null, email: null });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, [activeSessionId, setStatus]);

  return {
    status,
    isCheckingAuth,
    isAuthenticated: status?.authenticated ?? false,
    login,
    logout,
    checkAuth,
  };
}
