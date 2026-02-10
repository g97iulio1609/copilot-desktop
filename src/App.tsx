import { Titlebar } from '@/components/layout/Titlebar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainPanel } from '@/components/layout/MainPanel';
import { useSettingsStore } from '@/stores/settingsStore';
import { tauriApi } from '@/lib/tauri';
import { useEffect } from 'react';

export default function App() {
  const { setCopilotStatus } = useSettingsStore();

  useEffect(() => {
    tauriApi.checkCopilotStatus().then(setCopilotStatus).catch(console.error);
  }, [setCopilotStatus]);

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
