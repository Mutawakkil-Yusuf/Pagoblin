"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { bootPwa, usePwa } from "@/lib/pwa";
import { toast } from "@/lib/store/toasts";

/** Mounted once in the root layout: captures the install event and shows an offline pill. */
const PREFETCH = ["/done", "/app", "/app/tools", "/merge-pdf", "/split-pdf", "/compress-pdf", "/convert-pdf", "/sign-pdf", "/flows", "/settings"];

export function PwaBoot() {
  const { online } = usePwa();
  const router = useRouter();
  useEffect(() => {
    bootPwa();
  }, []);
  // A new service worker claims the page as soon as a deploy lands. The open
  // tab is still running the previous build's JS, whose worker chunks may no
  // longer exist, so every tool would fail until a reload. Say so plainly.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    let hadController = Boolean(navigator.serviceWorker.controller);
    const onChange = () => {
      if (!hadController) {
        hadController = true;
        return;
      }
      toast.action(
        "Pagoblin updated. Reload to keep your tools working.",
        { label: "Reload", onClick: () => window.location.reload() },
        60_000,
      );
    };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onChange);
  }, []);
  // Warm the route payloads (service worker keeps them) so navigating works with no connection.
  useEffect(() => {
    if (!online) return;
    const t = window.setTimeout(() => PREFETCH.forEach((r) => router.prefetch(r)), 2500);
    return () => window.clearTimeout(t);
  }, [online, router]);
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-[max(12px,env(safe-area-inset-top))] z-[70] -translate-x-1/2 rounded-pill border border-line bg-surface px-4 py-2 text-small font-bold text-cream shadow-pop"
    >
      Offline. Pip still works.
    </div>
  );
}
