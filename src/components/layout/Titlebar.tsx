import { cn } from '@/lib/utils';
import { Minus, Square, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function Titlebar() {
  const appWindow = '__TAURI_INTERNALS__' in window ? getCurrentWindow() : null;

  return (
    <div
      data-tauri-drag-region
      className={cn(
        'h-12 flex items-center justify-between px-4',
        'glass-titlebar border-b border-white/[0.06]',
        'shadow-[0_1px_3px_rgba(0,0,0,0.3)]',
        'select-none'
      )}
    >
      {/* macOS traffic light spacer */}
      <div className="w-[72px]" />

      <div
        data-tauri-drag-region
        className="flex-1 text-center text-[13px] font-medium text-zinc-400 tracking-tight"
      >
        Copilot Desktop
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => appWindow?.minimize()}
          className="p-1.5 rounded-md hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => appWindow?.toggleMaximize()}
          className="p-1.5 rounded-md hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
        >
          <Square size={12} />
        </button>
        <button
          onClick={() => appWindow?.close()}
          className="p-1.5 rounded-md hover:bg-red-500/15 text-zinc-500 hover:text-red-400 transition-colors duration-150"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
