"use client";

import { AnimatePresence, motion } from "motion/react";
import { useToasts } from "@/lib/store/toasts";
import { springs } from "@/lib/motion";

export function ToastHost() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed left-0 right-0 top-3 z-100 flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ y: -14, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", ...springs.bouncy }}
            className={`pointer-events-auto max-w-sm w-full rounded-card-l px-4 py-3 text-body shadow-drag flex items-center gap-3 border ${
              t.kind === "error"
                ? "border-amber bg-surface text-cream"
                : t.kind === "success"
                  ? "border-ink bg-amber text-ink"
                  : "bg-cream text-ink border-ink"
            }`}
            role={t.kind === "error" ? "alert" : "status"}
          >
            <p className={`flex-1 text-[14px] font-medium leading-snug ${t.kind === "error" ? "animate-error-shake" : ""}`}>
              {t.text}
            </p>
            {t.action ? (
              <button
                className="min-h-[44px] rounded-pill px-3 text-small font-bold underline-offset-2 hover:underline"
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            ) : (
              <button
                aria-label="Dismiss"
                className="text-ink/70 hover:text-ink min-h-[44px] px-1"
                onClick={() => dismiss(t.id)}
              >
                ✕
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
