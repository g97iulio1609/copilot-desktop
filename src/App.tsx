import { Sidebar } from '@/components/layout/Sidebar';
import { MainPanel } from '@/components/layout/MainPanel';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { ProjectPicker } from '@/components/layout/ProjectPicker';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { UpdateChecker } from '@/components/settings/UpdateChecker';
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

  if (isCheckingAuth || !status) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0e0e0e]">
        <div className="animate-spin h-8 w-8 border-2 border-neutral-700 border-t-neutral-300 rounded-full" />
      </div>
    );
  }

  if (!status.authenticated) {
    return <LoginScreen />;
  }

  if (!activeSessionId) {
    return <ProjectPicker />;
  }

  return (
    <div className="h-screen w-screen flex flex-row bg-[#0e0e0e] text-neutral-200 overflow-hidden">
      <UpdateChecker />
      <Sidebar />
      <MainPanel />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
