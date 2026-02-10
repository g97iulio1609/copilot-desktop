import { Titlebar } from '@/components/layout/Titlebar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainPanel } from '@/components/layout/MainPanel';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { ProjectPicker } from '@/components/layout/ProjectPicker';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { tauriApi } from '@/lib/tauri';
import { useEffect } from 'react';

export default function App() {
  const { setCopilotStatus } = useSettingsStore();
  const { status, isCheckingAuth, checkAuth } = useAuthStore();
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

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
    </div>
  );
}
