import { useSettingsStore } from '@/stores/settingsStore';
import { ChatPanel } from '@/components/chat/ChatPanel';

export function MainPanel() {
  const { currentView } = useSettingsStore();

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-zinc-900">
      {currentView === 'chat' && <ChatPanel />}
      {currentView === 'settings' && <SettingsPlaceholder />}
      {currentView === 'mcp' && <McpPlaceholder />}
      {currentView === 'plugins' && <PluginsPlaceholder />}
    </div>
  );
}

function SettingsPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center text-zinc-500">
      <p className="text-lg">Settings — Coming in Phase 8</p>
    </div>
  );
}

function McpPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center text-zinc-500">
      <p className="text-lg">MCP Server Manager — Coming in Phase 6</p>
    </div>
  );
}

function PluginsPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center text-zinc-500">
      <p className="text-lg">Plugin Marketplace — Coming in Phase 7</p>
    </div>
  );
}
