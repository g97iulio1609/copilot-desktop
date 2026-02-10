import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { tauriApi } from '@/lib/tauri';
import { UsageMetrics } from './UsageMetrics';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import {
  Settings,
  Type,
  Palette,
  Keyboard,
  Info,
  ChevronDown,
  Save,
  BarChart3,
} from 'lucide-react';
import type { AppConfig, ModelInfo } from '@/types';

const FONT_FAMILIES = ['SF Mono', 'JetBrains Mono', 'Fira Code', 'Menlo', 'Cascadia Code', 'Consolas'];
const ACCENT_COLORS = [
  { id: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { id: 'green', label: 'Green', class: 'bg-emerald-500' },
  { id: 'violet', label: 'Violet', class: 'bg-violet-500' },
  { id: 'amber', label: 'Amber', class: 'bg-amber-500' },
];

type SectionId = 'general' | 'editor' | 'appearance' | 'shortcuts' | 'usage' | 'about';

export function SettingsPanel() {
  const { config, setConfig, updateConfigField, copilotStatus } = useSettingsStore();
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
    new Set(['general', 'editor', 'appearance'])
  );
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);

  useEffect(() => {
    tauriApi.listAvailableModels().then(setModels).catch(console.error);
    tauriApi.getConfig().then((c) => {
      setConfig(c);
      setLocalConfig(c);
    }).catch(console.error);
  }, []);

  const toggleSection = (id: SectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const updateLocal = <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await tauriApi.updateConfig(localConfig);
      setConfig(localConfig);
      Object.entries(localConfig).forEach(([key, value]) => {
        updateConfigField(key as keyof AppConfig, value);
      });
      setDirty(false);
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-8 px-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Configure your workspace</p>
          </div>
          {dirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                'bg-blue-600 text-white hover:bg-blue-500',
                'disabled:opacity-50'
              )}
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        {/* General */}
        <Section
          id="general"
          title="General"
          icon={Settings}
          expanded={expandedSections.has('general')}
          onToggle={() => toggleSection('general')}
        >
          <div className="space-y-4">
            <Field label="Default Model">
              <select
                value={localConfig.default_model ?? ''}
                onChange={(e) => updateLocal('default_model', e.target.value || null)}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              >
                <option value="">Auto</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </Field>

            <Toggle
              label="Auto-scroll"
              description="Automatically scroll to the latest output"
              checked={localConfig.auto_scroll}
              onChange={(v) => updateLocal('auto_scroll', v)}
            />

            <Toggle
              label="Send on Enter"
              description="Press Enter to send messages (Shift+Enter for new line)"
              checked={localConfig.send_on_enter}
              onChange={(v) => updateLocal('send_on_enter', v)}
            />

            <Toggle
              label="Notification Sound"
              description="Play a sound when a response completes"
              checked={localConfig.notification_sound}
              onChange={(v) => updateLocal('notification_sound', v)}
            />
          </div>
        </Section>

        {/* Editor */}
        <Section
          id="editor"
          title="Editor"
          icon={Type}
          expanded={expandedSections.has('editor')}
          onToggle={() => toggleSection('editor')}
        >
          <div className="space-y-4">
            <Field label={`Font Size: ${localConfig.font_size}px`}>
              <input
                type="range"
                min={12}
                max={24}
                step={1}
                value={localConfig.font_size}
                onChange={(e) => updateLocal('font_size', Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                <span>12px</span>
                <span>24px</span>
              </div>
            </Field>

            <Field label="Font Family">
              <select
                value={localConfig.font_family}
                onChange={(e) => updateLocal('font_family', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>

            <Toggle
              label="Show Line Numbers"
              description="Display line numbers in code blocks"
              checked={localConfig.show_line_numbers}
              onChange={(v) => updateLocal('show_line_numbers', v)}
            />

            {/* Preview */}
            <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-700/30">
              <p className="text-[10px] text-zinc-600 mb-2 uppercase tracking-wider">Preview</p>
              <pre
                className="text-zinc-300"
                style={{
                  fontSize: `${localConfig.font_size}px`,
                  fontFamily: `${localConfig.font_family}, monospace`,
                  lineHeight: 1.6,
                }}
              >
                {localConfig.show_line_numbers ? '1 ' : ''}
                {'const hello = "world";'}
              </pre>
            </div>
          </div>
        </Section>

        {/* Appearance */}
        <Section
          id="appearance"
          title="Appearance"
          icon={Palette}
          expanded={expandedSections.has('appearance')}
          onToggle={() => toggleSection('appearance')}
        >
          <div className="space-y-4">
            <Field label="Theme">
              <div className="grid grid-cols-3 gap-2">
                {(['dark', 'light', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateLocal('theme', t === 'system' ? 'dark' : t)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors border',
                      localConfig.theme === (t === 'system' ? 'dark' : t) && t !== 'system'
                        ? 'bg-blue-600/10 border-blue-500/40 text-blue-400'
                        : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-200'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Accent Color">
              <div className="flex gap-3">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => updateLocal('accent_color', color.id)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all',
                      color.class,
                      localConfig.accent_color === color.id
                        ? 'ring-2 ring-offset-2 ring-offset-zinc-900'
                        : 'opacity-60 hover:opacity-100'
                    )}
                    style={
                      localConfig.accent_color === color.id
                        ? { ringColor: 'currentColor' }
                        : undefined
                    }
                    title={color.label}
                  />
                ))}
              </div>
            </Field>
          </div>
        </Section>

        {/* Usage Metrics */}
        <Section
          id="usage"
          title="Usage Metrics"
          icon={BarChart3}
          expanded={expandedSections.has('usage')}
          onToggle={() => toggleSection('usage')}
        >
          <UsageMetrics />
        </Section>

        {/* Keyboard Shortcuts */}
        <Section
          id="shortcuts"
          title="Keyboard Shortcuts"
          icon={Keyboard}
          expanded={expandedSections.has('shortcuts')}
          onToggle={() => toggleSection('shortcuts')}
        >
          <KeyboardShortcuts />
        </Section>

        {/* About */}
        <Section
          id="about"
          title="About"
          icon={Info}
          expanded={expandedSections.has('about')}
          onToggle={() => toggleSection('about')}
        >
          <div className="space-y-3">
            <InfoRow label="App Version" value="0.1.0" />
            <InfoRow
              label="Copilot CLI"
              value={copilotStatus?.version ?? 'Unknown'}
            />
            <InfoRow
              label="CLI Path"
              value={copilotStatus?.path ?? 'Not detected'}
            />
            <div className="flex gap-3 pt-2">
              <a
                href="https://github.com/g97iulio1609/copilot-desktop"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
              >
                GitHub Repository
              </a>
              <a
                href="https://docs.github.com/en/copilot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
              >
                Copilot Docs
              </a>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

// Collapsible section card
function Section({
  id,
  title,
  icon: Icon,
  expanded,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  icon: typeof Settings;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-800/50 rounded-xl border border-zinc-700/30 overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <Icon size={16} className="text-zinc-400" />
        <span className="flex-1 text-sm font-medium text-zinc-200">{title}</span>
        <ChevronDown
          size={16}
          className={cn(
            'text-zinc-500 transition-transform duration-200',
            expanded && 'rotate-180'
          )}
        />
      </button>
      {expanded && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

// Form field wrapper
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// Toggle switch
function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-zinc-200">{label}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-9 h-5 rounded-full transition-colors',
          checked ? 'bg-blue-600' : 'bg-zinc-700'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

// Info row for About section
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xs font-medium text-zinc-300 font-mono">{value}</span>
    </div>
  );
}
