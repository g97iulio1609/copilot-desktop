import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  MessageSquarePlus,
  FolderOpen,
  Cpu,
  Shuffle,
  Moon,
  Sun,
  Trash2,
  GitCompare,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSessionStore } from '@/stores/sessionStore';

interface Command {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme, setCurrentView } = useSettingsStore();
  const { addSession, activeSessionId } = useSessionStore();

  const commands = useMemo<Command[]>(
    () => [
      {
        id: 'new-session',
        label: 'New Session',
        icon: MessageSquarePlus,
        shortcut: '⌘N',
        action: () => {
          addSession({
            id: crypto.randomUUID(),
            name: 'New Session',
            working_dir: '~',
            model: null,
            mode: 'suggest',
            created_at: Date.now(),
            is_active: true,
          });
          onClose();
        },
      },
      {
        id: 'open-project',
        label: 'Open Project',
        icon: FolderOpen,
        action: () => {
          if (!activeSessionId) {
            setCurrentView('chat');
          }
          onClose();
        },
      },
      {
        id: 'change-model',
        label: 'Change Model',
        icon: Cpu,
        action: () => {
          setCurrentView('chat');
          onClose();
        },
      },
      {
        id: 'switch-mode',
        label: 'Switch Mode',
        icon: Shuffle,
        action: () => {
          setCurrentView('chat');
          onClose();
        },
      },
      {
        id: 'toggle-theme',
        label: theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
        icon: theme === 'dark' ? Sun : Moon,
        action: () => {
          setTheme(theme === 'dark' ? 'light' : 'dark');
          onClose();
        },
      },
      {
        id: 'clear-chat',
        label: 'Clear Chat',
        icon: Trash2,
        action: () => {
          onClose();
        },
      },
      {
        id: 'show-diff',
        label: 'Show Diff',
        icon: GitCompare,
        action: () => {
          setCurrentView('chat');
          onClose();
        },
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        shortcut: '⌘,',
        action: () => {
          setCurrentView('chat');
          onClose();
        },
      },
    ],
    [theme, setTheme, setCurrentView, addSession, activeSessionId, onClose],
  );

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [query, commands]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Clamp selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex((i) => Math.min(i, Math.max(filtered.length - 1, 0)));
  }, [filtered.length]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const runSelected = useCallback(() => {
    filtered[selectedIndex]?.action();
  }, [filtered, selectedIndex]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % filtered.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
          break;
        case 'Enter':
          e.preventDefault();
          runSelected();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filtered.length, runSelected, onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg rounded-xl border border-zinc-700/50 bg-zinc-900/95 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center border-b border-zinc-800 px-4">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command…"
            className="flex-1 bg-transparent py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none"
          />
          <kbd className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div ref={listRef} className="max-h-72 overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-zinc-500">
              No commands found
            </div>
          )}
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.id}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  i === selectedIndex
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200',
                )}
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => cmd.action()}
              >
                <Icon size={16} className="shrink-0" />
                <span className="flex-1">{cmd.label}</span>
                {cmd.shortcut && (
                  <kbd className="text-[11px] text-zinc-500">{cmd.shortcut}</kbd>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
