import { create } from 'zustand';
import type { FileChangeEvent, DiffResult } from '@/types';

interface FileState {
  changedFiles: FileChangeEvent[];
  selectedFile: string | null;
  diffResult: DiffResult | null;
  loading: boolean;
  addFileChange: (event: FileChangeEvent) => void;
  setSelectedFile: (path: string | null) => void;
  setDiffResult: (diff: DiffResult | null) => void;
  setChangedFiles: (files: FileChangeEvent[]) => void;
  setLoading: (loading: boolean) => void;
  clearFiles: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  changedFiles: [],
  selectedFile: null,
  diffResult: null,
  loading: false,

  addFileChange: (event) =>
    set((state) => {
      const existing = state.changedFiles.findIndex((f) => f.path === event.path);
      if (existing >= 0) {
        const updated = [...state.changedFiles];
        updated[existing] = event;
        return { changedFiles: updated };
      }
      return { changedFiles: [...state.changedFiles, event] };
    }),

  setSelectedFile: (selectedFile) => set({ selectedFile }),
  setDiffResult: (diffResult) => set({ diffResult }),
  setChangedFiles: (changedFiles) => set({ changedFiles }),
  setLoading: (loading) => set({ loading }),
  clearFiles: () =>
    set({ changedFiles: [], selectedFile: null, diffResult: null }),
}));
