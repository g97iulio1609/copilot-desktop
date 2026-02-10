import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePluginStore } from '@/stores/pluginStore';
import { tauriApi } from '@/lib/tauri';
import { PluginCard } from './PluginCard';
import { PluginDetails } from './PluginDetails';
import type { PluginInfo } from '@/types';

const CATEGORIES = ['All', 'Tools', 'Languages', 'Integrations'] as const;

export function PluginMarketplace() {
  const {
    installed,
    available,
    isLoading,
    searchQuery,
    activeTab,
    setInstalled,
    setAvailable,
    setSearchQuery,
    setActiveTab,
    setLoading,
  } = usePluginStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPlugin, setSelectedPlugin] = useState<PluginInfo | null>(null);

  const fetchPlugins = useCallback(async () => {
    setLoading(true);
    try {
      const [installedPlugins, availablePlugins] = await Promise.all([
        tauriApi.listInstalledPlugins(),
        tauriApi.listAvailablePlugins(),
      ]);
      setInstalled(installedPlugins);
      setAvailable(availablePlugins);
    } catch {
      // Silently handle — data will remain empty
    } finally {
      setLoading(false);
    }
  }, [setInstalled, setAvailable, setLoading]);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const plugins = activeTab === 'installed' ? installed : available;

  const filtered = plugins.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-900">
      <div className="mx-auto w-full max-w-4xl px-6 py-6 flex flex-col gap-5 flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-100">Plugins</h1>
          <button
            onClick={fetchPlugins}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1 w-fit">
          {(['installed', 'marketplace'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-1.5 text-sm rounded-md transition-colors capitalize',
                activeTab === tab
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              {tab}
              {tab === 'installed' && installed.length > 0 && (
                <span className="ml-1.5 text-xs text-zinc-500">
                  ({installed.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700/30 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1 text-xs rounded-full border transition-colors',
                selectedCategory === cat
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                  : 'bg-zinc-800/50 border-zinc-700/30 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600/50'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-zinc-800/50 border border-zinc-700/30 rounded-xl p-5 animate-pulse"
                >
                  <div className="h-4 bg-zinc-700/50 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-zinc-700/50 rounded w-1/4 mb-4" />
                  <div className="h-3 bg-zinc-700/50 rounded w-full mb-2" />
                  <div className="h-3 bg-zinc-700/50 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
              <svg
                className="w-12 h-12 mb-3 text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-sm">No plugins found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((plugin) => (
                <PluginCard
                  key={plugin.name}
                  plugin={plugin}
                  onClick={() => setSelectedPlugin(plugin)}
                  onRefresh={fetchPlugins}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selectedPlugin && (
        <PluginDetails
          plugin={selectedPlugin}
          onClose={() => setSelectedPlugin(null)}
          onRefresh={fetchPlugins}
        />
      )}
    </div>
  );
}
