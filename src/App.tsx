import { Titlebar } from '@/components/layout/Titlebar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainPanel } from '@/components/layout/MainPanel';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { ProjectPicker } from '@/components/layout/ProjectPicker';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useKeyboard } from '@/hooks/useKeyboard';
import { tauriApi } from '@/lib/tauri';
import { useEffect, useState, useMemo } from 'react';

export default function App() {
  const { setCopilotStatus } = useSettingsStore();
  const { status, isCheckingAuth, checkAuth } = useAuthStore();
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const addSession = useSessionStore((s) => s.addSession);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const shortcuts = useMemo(
    () => [
      {
        key: 'k',
        meta: true,
        handler: () => setPaletteOpen((o) => !o),
      },
      {
        key: 'n',
        meta: true,
        handler: () =>
          addSession({
            id: crypto.randomUUID(),
            name: 'New Session',
            working_dir: '~',
            model: null,
            mode: 'suggest' as const,
            created_at: Date.now(),
            is_active: true,
          }),
      },
    ],
    [addSession],
  );

  useKeyboard(shortcuts);

  useEffect(() => {
    tauriApi.checkCopilotStatus().then(setCopilotStatus).catch(console.error);
    checkAuth();
  }, [setCopilotStatus, checkAuth]);

  // Show loading while checking auth
  if (isCheckingAuth || !status) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-900">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-600 border-t-zinc-200 rounded-full" />
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!status.authenticated) {
    return <LoginScreen />;
  }

  // Show project picker if no active session
  if (!activeSessionId) {
    return <ProjectPicker />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-900 text-zinc-200 rounded-xl overflow-hidden border border-zinc-800/30">
      <Titlebar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <MainPanel />
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
