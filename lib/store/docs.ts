"use client";

/**
 * Per-tool working file stores (zustand). Files stay in memory on the device;
 * nothing is persisted except saved flows (IndexedDB, see flowStore).
 */
import { create } from "zustand";
import type { FileItem } from "@/lib/files";
import type { ToolKey } from "@/lib/toolRouting";

type ToolFiles = {
  files: Record<ToolKey, FileItem[]>;
  pageCount: Record<string, number>; // itemId -> pages (filled by workers)
  add: (tool: ToolKey, items: FileItem[]) => void;
  remove: (tool: ToolKey, id: string) => void;
  reorder: (tool: ToolKey, ids: string[]) => void;
  clear: (tool: ToolKey) => void;
  /** Drop every in-memory file and page count, for Settings → Clear. */
  clearAll: () => void;
  setPageCount: (id: string, n: number) => void;
};

export const useToolFiles = create<ToolFiles>()((set) => ({
  files: {
    home: [],
    merge: [],
    split: [],
    compress: [],
    convert: [],
    sign: [],
    flows: [],
    share: [],
    organize: [],
    protect: [],
    metadata: [],
    text: [],
    redact: [],
    form: [],
    ocr: [],
    batch: [],
  },
  pageCount: {},
  add: (tool, items) =>
    set((s) => {
      const existing = s.files[tool] ?? [];
      // Dedupe by name+size: re-adding the same file replaces it in place.
      const fresh = items.filter((i) => !existing.some((e) => e.name === i.name && e.size === i.size));
      return { files: { ...s.files, [tool]: [...existing, ...fresh] } };
    }),
  remove: (tool, id) =>
    set((s) => ({ files: { ...s.files, [tool]: (s.files[tool] ?? []).filter((f) => f.id !== id) } })),
  reorder: (tool, ids) =>
    set((s) => {
      const current = s.files[tool] ?? [];
      const map = new Map(current.map((f) => [f.id, f]));
      const next = ids.map((id) => map.get(id)).filter(Boolean) as FileItem[];
      if (next.length !== current.length) return {};
      return { files: { ...s.files, [tool]: next } };
    }),
  clear: (tool) => set((s) => ({ files: { ...s.files, [tool]: [] } })),
  clearAll: () =>
    set((s) => ({
      files: Object.keys(s.files).reduce(
        (acc, key) => {
          acc[key as ToolKey] = [];
          return acc;
        },
        {} as Record<ToolKey, FileItem[]>,
      ),
      pageCount: {},
    })),
  setPageCount: (id, n) => set((s) => ({ pageCount: { ...s.pageCount, [id]: n } })),
}));
