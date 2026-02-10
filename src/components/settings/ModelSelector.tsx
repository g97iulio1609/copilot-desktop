import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/stores/sessionStore';
import { tauriApi } from '@/lib/tauri';
import { ChevronDown, Check } from 'lucide-react';
import type { ModelInfo } from '@/types';

export function ModelSelector() {
  const { sessions, activeSessionId, setSessionModel } = useSessionStore();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const currentModel = activeSession?.model;
  const [defaultModel, setDefaultModel] = useState<string | null>(null);

  useEffect(() => {
    tauriApi.listAvailableModels().then(setModels).catch(console.error);
    tauriApi.getDefaultModel().then(setDefaultModel).catch(console.error);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = async (model: ModelInfo) => {
    if (!activeSessionId) return;
    await tauriApi.setModel(activeSessionId, model.id).catch(console.error);
    setSessionModel(activeSessionId, model.id);
    setOpen(false);
  };

  const grouped = models.reduce<Record<string, ModelInfo[]>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});

  const effectiveModel = currentModel ?? defaultModel;
  const displayName = models.find((m) => m.id === effectiveModel)?.name ?? effectiveModel ?? 'Select Model';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium',
          'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 transition-colors',
          'border border-zinc-700/50'
        )}
      >
        <span className="truncate max-w-[120px]">{displayName}</span>
        <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[220px] bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl py-1 overflow-hidden">
          {Object.entries(grouped).map(([provider, providerModels]) => (
            <div key={provider}>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                {provider}
              </div>
              {providerModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleSelect(model)}
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors',
                    model.id === effectiveModel
                      ? 'bg-blue-600/10 text-blue-400'
                      : 'text-zinc-300 hover:bg-zinc-700'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs">{model.name}</p>
                    <p className="text-[10px] text-zinc-500">{model.description}</p>
                  </div>
                  {model.id === effectiveModel && <Check size={14} className="shrink-0 text-blue-400" />}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
