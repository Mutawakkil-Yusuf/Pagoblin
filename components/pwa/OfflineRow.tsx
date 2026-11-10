"use client";

import { useEffect, useState } from "react";
import { isOfflineReady, warmOffline, OFFLINE_SIZE_LABEL } from "@/lib/offline";

/** Settings row: save the heavy engines so every tool works with no connection. */
export function OfflineRow() {
  const [state, setState] = useState<"checking" | "idle" | "saving" | "ready" | "failed">("checking");
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let alive = true;
    void isOfflineReady().then((ok) => alive && setState(ok ? "ready" : "idle"));
    return () => {
      alive = false;
    };
  }, []);

  const save = async () => {
    setState("saving");
    setPct(0);
    const ok = await warmOffline((d, t) => setPct(Math.round((d / t) * 100)));
    setState(ok ? "ready" : "failed");
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="font-bold text-cream">Work offline</div>
        <div className="text-small text-muted" aria-live="polite">
          {state === "ready"
            ? "Saved. Every tool works with no connection."
            : state === "failed"
              ? "That did not finish. Check your connection and try again."
              : `Save the PDF engines on this device (${OFFLINE_SIZE_LABEL}).`}
        </div>
      </div>
      {state === "ready" ? (
        <span className="rounded-pill bg-ink px-3 py-1.5 text-small font-bold text-amber">Ready</span>
      ) : (
        <button
          type="button"
          disabled={state === "saving" || state === "checking"}
          onClick={() => void save()}
          className="min-h-[44px] shrink-0 rounded-pill bg-orange px-5 font-bold text-ink disabled:opacity-60"
        >
          {state === "saving" ? `Saving ${pct}%` : "Save"}
        </button>
      )}
    </div>
  );
}
