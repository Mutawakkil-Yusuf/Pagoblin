"use client";

/**
 * TEMPORARY field diagnostics: any window error or unhandled promise
 * rejection shows in a fixed banner so problems can be read off the phone.
 * Remove once the tool breakage is identified.
 */
import { useEffect, useState } from "react";

type Msg = { kind: string; text: string };

export function DiagHook() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const push = (kind: string, e: unknown) => {
      const err = e as { message?: string; reason?: unknown; stack?: string };
      const text = (err?.message ?? (typeof err === "string" ? err : "")) || String(err?.reason ?? e);
      setMsgs((m) => [...m.slice(-4), { kind, text }]);
    };
    const onError = (e: ErrorEvent) => push("error", e.error ?? e.message);
    const onReject = (e: PromiseRejectionEvent) => push("rejection", e.reason);
    const onClg = (...args: unknown[]) => {
      if (args.some((a) => a instanceof Error)) push("console", args[0]);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);
    const orig = console.error.bind(console);
    console.error = ((...args: unknown[]) => {
      try {
        onClg(...args);
      } catch {}
      orig(...args);
    }) as typeof console.error;
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
      console.error = orig;
    };
  }, []);

  if (msgs.length === 0) return null;
  return (
    <button
      type="button"
      className="fixed inset-x-2 bottom-28 z-100 rounded-card border-2 border-orange bg-ink p-3 text-left"
      onClick={() => setOpen((v) => !v)}
    >
      <p className="text-[13px] font-bold text-orange">Pip bumping into something ({msgs.length}) — tap</p>
      {(open ? msgs : msgs.slice(-1)).map((m, i) => (
        <p key={i} className="mt-1 break-all font-mono text-[11px] leading-4 text-cream">
          [{m.kind}] {m.text}
        </p>
      ))}
    </button>
  );
}
