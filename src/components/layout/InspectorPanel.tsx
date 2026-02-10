import { cn } from '@/lib/utils';
import { useFileStore } from '@/stores/fileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { DiffViewer } from '@/components/files/DiffViewer';
import { X, GitCompare, FileText } from 'lucide-react';
import { useState } from 'react';

type InspectorTab = 'changes' | 'preview';

export function InspectorPanel() {
  const { inspectorOpen, toggleInspector } = useSettingsStore();
  const { selectedFile, diffResult } = useFileStore();
  const [activeTab, setActiveTab] = useState<InspectorTab>('changes');

  if (!inspectorOpen) return null;

  const tabs: { id: InspectorTab; label: string; icon: typeof GitCompare }[] = [
    { id: 'changes', label: 'Changes', icon: GitCompare },
    { id: 'preview', label: 'Preview', icon: FileText },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 shrink-0">
        <div className="flex">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                activeTab === id
                  ? 'text-zinc-200 border-b-2 border-blue-500'
                  : 'text-zinc-500 hover:text-zinc-400'
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={toggleInspector}
          className="p-1.5 mr-2 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'changes' && <DiffViewer />}
        {activeTab === 'preview' && (
          <PreviewPanel selectedFile={selectedFile} diffResult={diffResult} />
        )}
      </div>
    </div>
  );
}

function PreviewPanel({
  selectedFile,
  diffResult,
}: {
  selectedFile: string | null;
  diffResult: { path: string; hunks: { lines: { content: string; line_type: string }[] }[] } | null;
}) {
  if (!selectedFile || !diffResult) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm h-full">
        Select a file to preview
      </div>
    );
  }

  // Reconstruct file content from diff (new version)
  const lines = diffResult.hunks.flatMap((hunk) =>
    hunk.lines
      .filter((l) => l.line_type !== 'remove')
      .map((l) => l.content)
  );

  return (
    <div className="h-full overflow-auto bg-zinc-950">
      <div className="px-4 py-2 border-b border-zinc-800/50 text-xs text-zinc-500 truncate">
        {selectedFile}
      </div>
      <pre className="p-4 text-xs font-mono text-zinc-300 whitespace-pre overflow-x-auto">
        {lines.join('\n') || 'No content available'}
      </pre>
    </div>
  );
}
