import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { McpServerConfig } from '@/types';

interface McpServerFormProps {
  server: McpServerConfig | null;
  onSave: (server: McpServerConfig) => void;
  onCancel: () => void;
}

export function McpServerForm({ server, onSave, onCancel }: McpServerFormProps) {
  const [name, setName] = useState(server?.name ?? '');
  const [command, setCommand] = useState(server?.command ?? '');
  const [argsText, setArgsText] = useState(server?.args.join('\n') ?? '');
  const [envText, setEnvText] = useState(
    server?.env
      ? Object.entries(server.env)
          .map(([k, v]) => `${k}=${v}`)
          .join('\n')
      : ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!command.trim()) errs.command = 'Command is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const args = argsText
      .split('\n')
      .map((a) => a.trim())
      .filter(Boolean);

    const env: Record<string, string> = {};
    envText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const idx = line.indexOf('=');
        if (idx > 0) {
          env[line.slice(0, idx)] = line.slice(idx + 1);
        }
      });

    onSave({
      name: name.trim(),
      command: command.trim(),
      args,
      env: Object.keys(env).length > 0 ? env : null,
      enabled: server?.enabled ?? true,
      status: null,
    });
  };

  const inputClass = cn(
    'w-full px-3 py-2 rounded-lg text-sm',
    'bg-zinc-800/50 border border-zinc-700/30 text-zinc-200',
    'placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg mx-4 rounded-xl bg-zinc-900 border border-zinc-700/50 shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100">
            {server ? 'Edit MCP Server' : 'Add MCP Server'}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-server"
              className={cn(inputClass, errors.name && 'border-red-500/50')}
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Command</label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="npx or /path/to/server"
              className={cn(inputClass, errors.command && 'border-red-500/50')}
            />
            {errors.command && <p className="text-xs text-red-400 mt-1">{errors.command}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Arguments <span className="text-zinc-600">(one per line)</span>
            </label>
            <textarea
              value={argsText}
              onChange={(e) => setArgsText(e.target.value)}
              placeholder={'-y\n@modelcontextprotocol/server-filesystem'}
              rows={3}
              className={cn(inputClass, 'font-mono resize-none')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Environment Variables <span className="text-zinc-600">(KEY=value per line)</span>
            </label>
            <textarea
              value={envText}
              onChange={(e) => setEnvText(e.target.value)}
              placeholder="API_KEY=xxx"
              rows={2}
              className={cn(inputClass, 'font-mono resize-none')}
            />
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            {server ? 'Save Changes' : 'Add Server'}
          </button>
        </div>
      </form>
    </div>
  );
}
