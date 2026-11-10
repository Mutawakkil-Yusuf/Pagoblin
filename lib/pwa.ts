"use client";

/** Install + connectivity state. The beforeinstallprompt event fires once, early, so an inline
 * script in the layout stores it on window.__bip and this module picks it up. */
import { useSyncExternalStore } from "react";
import { warmOffline } from "@/lib/offline";

export type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type State = { deferred: BIPEvent | null; installed: boolean; online: boolean };

declare global {
  interface Window {
    __bip?: BIPEvent;
  }
}

const SERVER: State = { deferred: null, installed: false, online: true };
let state: State = SERVER;
const listeners = new Set<() => void>();
const set = (p: Partial<State>) => {
  state = { ...state, ...p };
  listeners.forEach((l) => l());
};

let booted = false;
export function bootPwa() {
  if (booted || typeof window === "undefined") return;
  booted = true;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  set({ installed: standalone, online: navigator.onLine, deferred: window.__bip ?? null });
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.__bip = e as BIPEvent;
    set({ deferred: e as BIPEvent });
  });
  window.addEventListener("appinstalled", () => {
    set({ installed: true, deferred: null });
    void warmOffline(); // installing is a clear yes to working offline
  });
  window.addEventListener("online", () => set({ online: true }));
  window.addEventListener("offline", () => set({ online: false }));
}

export function usePwa(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => SERVER,
  );
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const ev = state.deferred;
  if (!ev) return "unavailable";
  try {
    await ev.prompt();
    const choice = await ev.userChoice;
    set({ deferred: null });
    window.__bip = undefined;
    return choice.outcome;
  } catch {
    return "unavailable";
  }
}
