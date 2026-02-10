import { useSettingsStore } from '@/stores/settingsStore';
import { useSessionStore } from '@/stores/sessionStore';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { InspectorPanel } from '@/components/layout/InspectorPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { McpManager } from '@/components/mcp/McpManager';
import { PluginMarketplace } from '@/components/plugins/PluginMarketplace';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { X } from 'lucide-react';

export function MainPanel() {
  const { currentView, setCurrentView, inspectorOpen } = useSettingsStore();
  const { sessions, activeSessionId } = useSessionStore();
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const showOverlay = currentView !== 'chat';

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0e0e0e]">
      {/* Top bar with drag region */}
      <div
        data-tauri-drag-region
        className="flex items-center h-[38px] shrink-0 px-4 select-none"
      >
        {activeSession && (
          <h2 className="text-sm font-medium text-neutral-200 truncate pointer-events-none">
            {activeSession.name}
          </h2>
        )}
      </div>

      {/* Main content: chat + inspector */}
      <div className="flex-1 flex flex-col min-h-0">
        <PanelGroup direction="horizontal" className="flex-1">
          <Panel defaultSize={inspectorOpen ? 60 : 100} minSize={40}>
            <ChatPanel />
          </Panel>
          {inspectorOpen && (
            <>
              <PanelResizeHandle className="w-1 bg-neutral-800/50 hover:bg-blue-500/30 transition-colors cursor-col-resize" />
              <Panel defaultSize={40} minSize={25}>
                <InspectorPanel />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Overlay for settings/mcp/plugins */}
      {showOverlay && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="relative w-full max-w-2xl max-h-[80vh] mx-4 rounded-2xl bg-[#1a1a1a] border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col">
            <button
              onClick={() => setCurrentView('chat')}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.06] transition-colors"
            >
              <X size={16} />
            </button>
            <div className="flex-1 overflow-y-auto">
              {currentView === 'settings' && <SettingsPanel />}
              {currentView === 'mcp' && <McpManager />}
              {currentView === 'plugins' && <PluginMarketplace />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
