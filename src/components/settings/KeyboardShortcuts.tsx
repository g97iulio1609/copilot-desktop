import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import type { KeyboardShortcut } from '@/types';

const SHORTCUTS: KeyboardShortcut[] = [
  // Global
  { key: '⌘ K', description: 'Open command palette', category: 'Global' },
  { key: '⌘ ,', description: 'Open settings', category: 'Global' },
  { key: '⌘ N', description: 'New session', category: 'Global' },
  { key: '⌘ W', description: 'Close session', category: 'Global' },
  { key: '⌘ 1-9', description: 'Switch to session tab', category: 'Global' },
  // Terminal
  { key: 'Ctrl C', description: 'Cancel current operation', category: 'Terminal' },
  { key: 'Ctrl D', description: 'End of input / exit', category: 'Terminal' },
  { key: 'Ctrl L', description: 'Clear terminal screen', category: 'Terminal' },
  { key: 'Ctrl A', description: 'Move cursor to start of line', category: 'Terminal' },
  { key: 'Ctrl E', description: 'Move cursor to end of line', category: 'Terminal' },
  // Commands
  { key: '/', description: 'Start slash command', category: 'Commands' },
  { key: '/help', description: 'Show help information', category: 'Commands' },
  { key: '/model', description: 'Change AI model', category: 'Commands' },
  { key: '/clear', description: 'Clear conversation history', category: 'Commands' },
  { key: '/compact', description: 'Compact conversation context', category: 'Commands' },
  { key: '/usage', description: 'Show usage statistics', category: 'Commands' },
  // Navigation
  { key: '↑ / ↓', description: 'Navigate message history', category: 'Navigation' },
  { key: 'Ctrl O', description: 'Open file browser', category: 'Navigation' },
  { key: 'Ctrl T', description: 'Toggle sidebar', category: 'Navigation' },
  { key: 'Tab', description: 'Accept suggestion', category: 'Navigation' },
  { key: 'Esc', description: 'Dismiss / cancel', category: 'Navigation' },
];

export function KeyboardShortcuts() {
  const [search, setSearch] = useState('');

  const filtered = SHORTCUTS.filter(
    (s) =>
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.key.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, KeyboardShortcut[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search shortcuts..."
          className="w-full pl-9 pr-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {Object.entries(grouped).map(([category, shortcuts]) => (
        <div key={category}>
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            {category}
          </h4>
          <div className="space-y-1">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.key + shortcut.description}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-800/30"
              >
                <span className="text-sm text-zinc-300">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {shortcut.key.split(' ').map((k, i) => (
                    <kbd
                      key={i}
                      className={cn(
                        'inline-flex items-center justify-center min-w-[24px] h-6 px-1.5',
                        'bg-zinc-700/60 border border-zinc-600/50 rounded text-[11px] font-medium text-zinc-300',
                        'shadow-[0_1px_0_0_rgba(0,0,0,0.3)]'
                      )}
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="text-sm text-zinc-500 text-center py-4">No shortcuts found</p>
      )}
    </div>
  );
}
