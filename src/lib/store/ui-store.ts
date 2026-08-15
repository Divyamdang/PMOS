import { create } from "zustand";

type UIStore = {
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  quickCaptureOpen: boolean;
  setQuickCaptureOpen: (open: boolean) => void;
  taskDrawerTaskId: string | null;
  openTaskDrawer: (taskId: string) => void;
  closeTaskDrawer: () => void;
};

export const useUIStore = create<UIStore>((set) => ({
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  quickCaptureOpen: false,
  setQuickCaptureOpen: (open) => set({ quickCaptureOpen: open }),
  taskDrawerTaskId: null,
  openTaskDrawer: (taskId) => set({ taskDrawerTaskId: taskId }),
  closeTaskDrawer: () => set({ taskDrawerTaskId: null }),
}));
