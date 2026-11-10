"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { bootPwa, usePwa } from "@/lib/pwa";

/** Mounted once in the root layout: captures the install event and shows an offline pill. */
const PREFETCH = ["/done", "/app", "/app/tools", "/merge-pdf", "/split-pdf", "/compress-pdf", "/convert-pdf", "/sign-pdf", "/flows", "/settings"];

export function PwaBoot() {
  const { online } = usePwa();
  const router = useRouter();
  useEffect(() => {
    bootPwa();
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
