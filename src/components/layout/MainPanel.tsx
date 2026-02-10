import { useSettingsStore } from '@/stores/settingsStore';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { InspectorPanel } from '@/components/layout/InspectorPanel';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export function MainPanel() {
  const { currentView, inspectorOpen } = useSettingsStore();

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-zinc-900">
      {currentView === 'chat' && (
        <PanelGroup direction="horizontal" className="flex-1">
          <Panel defaultSize={inspectorOpen ? 60 : 100} minSize={40}>
            <ChatPanel />
          </Panel>
          {inspectorOpen && (
            <>
              <PanelResizeHandle className="w-1 bg-zinc-800/50 hover:bg-blue-500/30 transition-colors cursor-col-resize" />
              <Panel defaultSize={40} minSize={25}>
                <InspectorPanel />
              </Panel>
            </>
          )}
        </PanelGroup>
      )}
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
