import { useState, useEffect, useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { cn } from '@/lib/utils';
import { tauriApi } from '@/lib/tauri';
import { useSessionStore } from '@/stores/sessionStore';

interface ProjectPickerProps {
  onProjectOpened?: () => void;
}

export function ProjectPicker({ onProjectOpened }: ProjectPickerProps) {
  const [recentProjects, setRecentProjects] = useState<string[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const { addSession } = useSessionStore();

  useEffect(() => {
    tauriApi.getRecentProjects().then(setRecentProjects).catch(console.error);
  }, []);

  const openProject = useCallback(
    async (path: string) => {
      setIsOpening(true);
      try {
        const folderName =
          path.split('/').pop() || path.split('\\').pop() || 'project';
        const session = await tauriApi.openProject(path, folderName);
        addSession(session);
        onProjectOpened?.();
      } catch (err) {
        console.error('Failed to open project:', err);
      } finally {
        setIsOpening(false);
      }
    },
    [addSession, onProjectOpened],
  );

  const handleSelectFolder = useCallback(async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected) {
        await openProject(selected as string);
      }
    } catch (err) {
      console.error('Failed to select directory:', err);
    }
  }, [openProject]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-zinc-900">
      <div
        className={cn(
          'flex flex-col gap-6 p-8 rounded-2xl',
          'bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/40',
          'shadow-2xl shadow-black/40',
          'max-w-lg w-full mx-4',
        )}
      >
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-zinc-100">
            Open a Project
          </h2>
          <p className="text-sm text-zinc-400">
            Select a folder to start a Copilot session
          </p>
        </div>

        {/* Folder Picker Button */}
        <button
          onClick={handleSelectFolder}
          disabled={isOpening}
          className={cn(
            'flex items-center justify-center gap-3 px-6 py-4 rounded-xl',
            'border-2 border-dashed border-zinc-600 hover:border-zinc-400',
            'text-zinc-300 hover:text-zinc-100',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-5 h-5"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
            />
          </svg>
          <span className="font-medium text-sm">
            {isOpening ? 'Opening...' : 'Choose Folder'}
          </span>
        </button>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Recent Projects
            </h3>
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
              {recentProjects.map((project) => {
                const parts = project.replace(/\\/g, '/').split('/');
                const folderName = parts[parts.length - 1] || project;
                return (
                  <button
                    key={project}
                    onClick={() => openProject(project)}
                    disabled={isOpening}
                    className={cn(
                      'flex flex-col gap-0.5 px-4 py-3 rounded-lg text-left',
                      'hover:bg-zinc-800/60 transition-colors duration-150',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                  >
                    <span className="text-sm font-medium text-zinc-200">
                      {folderName}
                    </span>
                    <span className="text-xs text-zinc-500 truncate">
                      {project}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
