import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMcpStore } from '@/stores/mcpStore';
import { tauriApi } from '@/lib/tauri';
import { McpServerCard } from './McpServerCard';
import { McpServerForm } from './McpServerForm';
import type { McpServerConfig } from '@/types';

export function McpManager() {
  const { servers, isLoading, searchQuery, setServers, setLoading, setSearchQuery } = useMcpStore();
  const [showForm, setShowForm] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServerConfig | null>(null);

  const loadServers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await tauriApi.listMcpServers();
      setServers(list);
    } catch (err) {
      console.error('Failed to load MCP servers:', err);
    } finally {
      setLoading(false);
    }
  }, [setServers, setLoading]);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  const handleAdd = () => {
    setEditingServer(null);
    setShowForm(true);
  };

  const handleEdit = (server: McpServerConfig) => {
    setEditingServer(server);
    setShowForm(true);
  };

  const handleDelete = async (name: string) => {
    try {
      await tauriApi.deleteMcpServer(name);
      await loadServers();
    } catch (err) {
      console.error('Failed to delete MCP server:', err);
    }
  };

  const handleToggle = async (name: string, enabled: boolean) => {
    try {
      await tauriApi.toggleMcpServer(name, enabled);
      useMcpStore.getState().toggleServer(name);
    } catch (err) {
      console.error('Failed to toggle MCP server:', err);
    }
  };

  const handleFormSave = async (server: McpServerConfig) => {
    try {
      if (editingServer) {
        await tauriApi.updateMcpServer(editingServer.name, server);
      } else {
        await tauriApi.addMcpServer(server);
      }
      setShowForm(false);
      setEditingServer(null);
      await loadServers();
    } catch (err) {
      console.error('Failed to save MCP server:', err);
    }
  };

  const filtered = servers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-zinc-100">MCP Servers</h1>
          <button
            onClick={handleAdd}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'bg-blue-600 hover:bg-blue-500 text-white'
            )}
          >
            + Add Server
          </button>
        </div>

        <input
          type="text"
          placeholder="Search servers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'w-full px-3 py-2 rounded-lg text-sm',
            'bg-zinc-800/50 border border-zinc-700/30 text-zinc-200',
            'placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50'
          )}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-zinc-500">
            <p>Loading servers...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <div className="text-5xl mb-4">🔌</div>
            <p className="text-lg font-medium mb-1">No MCP servers configured</p>
            <p className="text-sm text-zinc-600">
              {searchQuery
                ? 'No servers match your search'
                : 'Add a server to extend Copilot with external tools'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 max-w-3xl">
            {filtered.map((server) => (
              <McpServerCard
                key={server.name}
                server={server}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <McpServerForm
          server={editingServer}
          onSave={handleFormSave}
          onCancel={() => {
            setShowForm(false);
            setEditingServer(null);
          }}
        />
      )}
    </div>
  );
}
