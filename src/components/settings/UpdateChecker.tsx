import { useState, useEffect, useCallback } from 'react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { Download, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UpdateChecker() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdates = useCallback(async () => {
    try {
      const available = await check();
      if (available) {
        setUpdate(available);
      }
    } catch (e) {
      console.error('Update check failed:', e);
    }
  }, []);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  const handleUpdate = async () => {
    if (!update) return;
    setDownloading(true);
    setError(null);
    setProgress(0);

    try {
      let totalLength = 0;
      let downloaded = 0;

      await update.downloadAndInstall((event) => {
        if (event.event === 'Started' && event.data.contentLength) {
          totalLength = event.data.contentLength;
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          if (totalLength > 0) {
            setProgress(Math.round((downloaded / totalLength) * 100));
          }
        } else if (event.event === 'Finished') {
          setProgress(100);
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
      setDownloading(false);
    }
  };

  if (!update || dismissed) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-600/10 border-b border-blue-500/20 text-sm">
      <RefreshCw size={14} className="text-blue-400 shrink-0" />

      {downloading ? (
        <div className="flex-1 flex items-center gap-3">
          <span className="text-blue-300 shrink-0">
            {progress < 100 ? 'Downloading update…' : 'Installing…'}
          </span>
          <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden max-w-xs">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 tabular-nums">{progress}%</span>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center gap-3">
          <span className="text-red-400">{error}</span>
          <button
            onClick={handleUpdate}
            className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-zinc-300">
            Update available: <span className="font-medium text-blue-300">v{update.version}</span>
          </span>
          <button
            onClick={handleUpdate}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors',
              'bg-blue-600 text-white hover:bg-blue-500'
            )}
          >
            <Download size={12} />
            Update Now
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </>
      )}
    </div>
  );
}
