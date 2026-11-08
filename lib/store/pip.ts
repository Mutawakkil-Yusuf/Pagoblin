"use client";

import { create } from "zustand";

/**
 * Drop zones feed this: Pip opens his mouth while a file is dragged over any
 * drop zone, then gulps on drop (scale pulse + sound handled by feeders).
 */
type PipEvents = {
  mouthOpen: boolean;
  gulpAt: number;
  setMouthOpen: (open: boolean) => void;
  gulp: () => void;
};

export const usePipEvents = create<PipEvents>()((set) => ({
  mouthOpen: false,
  gulpAt: 0,
  setMouthOpen: (open) => set({ mouthOpen: open }),
  gulp: () => set({ gulpAt: Date.now() }),
}));
