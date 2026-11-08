"use client";

import { create } from "zustand";

export type ToastKind = "info" | "success" | "error";

export type Toast = { id: string; text: string; kind: ToastKind; action?: { label: string; onClick: () => void } };

type ToastStore = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">, ms?: number) => void;
  dismiss: (id: string) => void;
};

export const useToasts = create<ToastStore>()((set, get) => ({
  toasts: [],
  push: (t, ms = 3800) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
    setTimeout(() => get().dismiss(id), ms);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  info: (text: string, ms?: number) => useToasts.getState().push({ text, kind: "info" }, ms),
  success: (text: string, ms?: number) => useToasts.getState().push({ text, kind: "success" }, ms),
  error: (text: string, ms?: number) => useToasts.getState().push({ text, kind: "error" }, ms),
  action: (text: string, action: Toast["action"], ms?: number) =>
    useToasts.getState().push({ text, kind: "info", action }, ms),
};
