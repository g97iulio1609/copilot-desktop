import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useFileStore } from '@/stores/fileStore';
import { tauriApi } from '@/lib/tauri';
import {
  FileCode,
  FileText,
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import type { FileChangeEvent } from '@/types';

const CODE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'rs', 'py', 'go', 'java', 'c', 'cpp', 'h',
  'css', 'scss', 'html', 'vue', 'svelte', 'rb', 'php', 'swift', 'kt',
]);

const TEXT_EXTENSIONS = new Set([
  'md', 'txt', 'json', 'yaml', 'yml', 'toml', 'xml', 'csv', 'env', 'gitignore',
]);

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (CODE_EXTENSIONS.has(ext)) return FileCode;
  if (TEXT_EXTENSIONS.has(ext)) return FileText;
  return File;
}

function getChangeColor(kind: string) {
  switch (kind) {
    case 'created': return 'bg-emerald-500';
    case 'modified': return 'bg-amber-500';
    case 'deleted': return 'bg-red-500';
    default: return 'bg-zinc-500';
  }
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
  changeKind?: string;
}

function buildTree(files: FileChangeEvent[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join('/');

      let node = current.find((n) => n.name === name);
      if (!node) {
        node = {
          name,
          path,
          isDir: !isLast,
          children: [],
          changeKind: isLast ? file.kind : undefined,
        };
        current.push(node);
      }
      current = node.children;
    }
  }

  return root;
}

function TreeItem({
  node,
  depth,
  selectedFile,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedFile: string | null;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isSelected = selectedFile === node.path;

  if (node.isDir) {
    const FolderIcon = expanded ? FolderOpen : Folder;
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex items-center gap-1.5 w-full text-left py-1 px-2 rounded-md text-sm',
            'hover:bg-zinc-800/50 text-zinc-400 transition-colors'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <FolderIcon size={14} className="text-zinc-500 shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && (
          <div>
            {node.children
              .sort((a, b) => {
                if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
                return a.name.localeCompare(b.name);
              })
              .map((child) => (
                <TreeItem
                  key={child.path}
                  node={child}
                  depth={depth + 1}
                  selectedFile={selectedFile}
                  onSelect={onSelect}
                />
              ))}
          </div>
        )}
      </div>
    );
  }

  const FileIcon = getFileIcon(node.name);

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={cn(
        'flex items-center gap-1.5 w-full text-left py-1 px-2 rounded-md text-sm',
        'transition-colors group',
        isSelected
          ? 'bg-zinc-800 text-zinc-200'
          : 'hover:bg-zinc-800/50 text-zinc-400'
      )}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
    >
      <FileIcon size={14} className="shrink-0 text-zinc-500" />
      <span className="truncate flex-1">{node.name}</span>
      {node.changeKind && (
        <span
          className={cn('w-2 h-2 rounded-full shrink-0', getChangeColor(node.changeKind))}
          title={node.changeKind}
        />
      )}
    </button>
  );
}

export function FileTree() {
  const { changedFiles, selectedFile, setSelectedFile, setDiffResult, setLoading } =
    useFileStore();

  const handleSelect = useCallback(
    async (path: string) => {
      setSelectedFile(path);
      setLoading(true);
      try {
        const diff = await tauriApi.getDiff(path);
        setDiffResult(diff);
      } catch (err) {
        console.error('Failed to get diff:', err);
        setDiffResult(null);
      } finally {
        setLoading(false);
      }
    },
    [setSelectedFile, setDiffResult, setLoading]
  );

  if (changedFiles.length === 0) return null;

  const tree = buildTree(changedFiles);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Files
        </span>
        <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full font-medium">
          {changedFiles.length}
        </span>
      </div>
      <div className="space-y-0.5 overflow-y-auto max-h-48">
        {tree
          .sort((a, b) => {
            if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
            return a.name.localeCompare(b.name);
          })
          .map((node) => (
            <TreeItem
              key={node.path}
              node={node}
              depth={0}
              selectedFile={selectedFile}
              onSelect={handleSelect}
            />
          ))}
      </div>
    </div>
  );
}
