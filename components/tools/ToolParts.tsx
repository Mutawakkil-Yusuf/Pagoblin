"use client";

/** Shared tool furniture so every Phase 1 tool speaks the same visual language. */
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Pip } from "@/components/pip/Pip";
import { Button } from "@/components/ui/core";
import { IconClose } from "@/components/ui/Icons";
import { sound } from "@/lib/sound";

export function FileHead(props: {
  name: string;
  meta?: string;
  onRemove?: () => void;
  tone?: "amber" | "surface";
}) {
  const { name, meta, onRemove, tone = "amber" } = props;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between gap-3 rounded-phone-chip px-3.5 py-3 ${
        tone === "amber" ? "bg-amber text-ink" : "bg-surface text-cream"
      }`}
    >
      <span className="min-w-0 flex-1 truncate font-bold text-[15px]">{name}</span>
      {meta ? <span className="tnum shrink-0 text-[12px]">{meta}</span> : null}
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${name}`}
          className={`flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[22px] ${
            tone === "amber" ? "bg-ink/10 text-ink" : "bg-line/60 text-cream"
          }`}
          onClick={() => {
            onRemove();
            sound.play("pop");
          }}
        >
          <IconClose width={16} height={16} />
        </button>
      ) : null}
    </motion.div>
  );
}

export function BusyCard(props: {
  progress: number;
  label?: string;
  onCancel?: () => void;
  cancelLabel?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(props.progress * 100)));
  return (
    <div className="rounded-card-l bg-surface p-5 text-center" role="status" aria-live="polite">
      <Pip mood="chewing" size={112} className="mx-auto" />
      <p className="mt-2 min-h-[22px] text-body text-muted">{props.label || "Chewing…"}</p>
      <div className="mx-auto mt-3 h-[10px] max-w-[320px] overflow-hidden rounded-pill bg-ink">
        <motion.div
          className="h-full rounded-pill bg-amber"
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 160, damping: 24 }}
        />
      </div>
      <p className="tnum mt-2 text-small text-muted">{pct}%</p>
      {props.onCancel ? (
        <Button variant="surface" size="md" className="mt-3" onClick={props.onCancel}>
          {props.cancelLabel ?? "Cancel"}
        </Button>
      ) : null}
    </div>
  );
}

export function ToolCard(props: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card-l bg-surface p-5 ${props.className ?? ""}`}>{props.children}</div>;
}

export function ToolNote(props: { children: ReactNode; className?: string }) {
  return (
    <p className={`flex items-start gap-2 text-small leading-5 text-muted ${props.className ?? ""}`}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-amber"
      >
        <rect x="4" y="10" width="16" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 018 0v3" />
      </svg>
      <span>{props.children}</span>
    </p>
  );
}

export function StickyAction(props: { children: ReactNode }) {
  return <div className="sticky bottom-28 z-10 md:bottom-8">{props.children}</div>;
}
