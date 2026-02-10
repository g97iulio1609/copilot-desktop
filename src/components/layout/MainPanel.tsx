import { useSettingsStore } from '@/stores/settingsStore';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { InspectorPanel } from '@/components/layout/InspectorPanel';
import { Toolbar } from '@/components/layout/Toolbar';
import { SessionTabs } from '@/components/session/SessionTabs';
import { McpManager } from '@/components/mcp/McpManager';
import { PluginMarketplace } from '@/components/plugins/PluginMarketplace';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export function MainPanel() {
  const { currentView, inspectorOpen } = useSettingsStore();

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-zinc-900">
      <SessionTabs />
      <Toolbar />
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
      {currentView === 'mcp' && <McpManager />}
      {currentView === 'plugins' && <PluginMarketplace />}
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
