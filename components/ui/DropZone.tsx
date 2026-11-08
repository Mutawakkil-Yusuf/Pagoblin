"use client";

/**
 * Drop zone used everywhere: drag and drop, paste, file picker.
 * Dashed border marches while a file hovers, the circle pulses, Pip opens his
 * mouth, then gulps on drop.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { filesFromTransfer, makeFileItems, pickFiles, type FileItem, type FileKind, fileErrors } from "@/lib/files";
import { usePipEvents } from "@/lib/store/pip";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { toast } from "@/lib/store/toasts";

export function DropZone(props: {
  accept: FileKind[];
  onFiles: (items: FileItem[]) => void | Promise<void>;
  children?: ReactNode;
  className?: string;
  /** Big hero variant (Home) vs compact inline variant. */
  variant?: "hero" | "inline";
  label?: string;
  hint?: string;
  disabled?: boolean;
}) {
  const { accept, onFiles, children, className, variant = "inline", label, hint, disabled } = props;
  const [hot, setHot] = useState(false);
  const reduce = useReducedMotion();
  const setPipMouth = usePipEvents((s) => s.setMouthOpen);
  const gulp = usePipEvents((s) => s.gulp);
  const depth = useRef(0);

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      const items = await makeFileItems(files, { accept, toolLabel: "this tool" });
      items.rejects.forEach((r) => toast.error(r.reason));
      if (items.items.length) {
        sound.play("gulp");
        haptic("success");
        gulp();
        await onFiles(items.items);
      }
    },
    [accept, gulp, onFiles],
  );
  // Paste support on the whole window while this zone is mounted.
  useEffect(() => {
    if (disabled) return;
    const onPaste = (e: ClipboardEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const files = filesFromTransfer(e.clipboardData);
      if (files.length) {
        e.preventDefault();
        void handleFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [disabled, handleFiles]);

  return (
    <section
      aria-label={label ?? "Add files"}
      data-testid="dropzone"
      className={`dropzone group relative overflow-hidden rounded-card-l border-2 transition-colors ${
        hot ? "dropzone-hot border-amber bg-surface" : "border-dashed border-line bg-transparent"
      } ${variant === "hero" ? "px-6 py-10" : "px-4 py-6"} ${className ?? ""}`}
      onDragEnter={(e) => {
        if (disabled) return;
        e.preventDefault();
        depth.current += 1;
        setHot(true);
        setPipMouth(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDragLeave={() => {
        depth.current -= 1;
        if (depth.current <= 0) {
          depth.current = 0;
          setHot(false);
          setPipMouth(false);
        }
      }}
      onDrop={async (e) => {
        if (disabled) return;
        e.preventDefault();
        depth.current = 0;
        setHot(false);
        setPipMouth(false);
        void handleFiles(filesFromTransfer(e.dataTransfer));
      }}
    >
      {/* marching dashes */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <rect
          x="1"
          y="1"
          width="98"
          height="98"
          fill="none"
          stroke="var(--amber)"
          strokeWidth="0.6"
          strokeDasharray="4 3"
          className={hot && !reduce ? "pg-march" : ""}
          style={{ opacity: hot ? 1 : 0, transition: "opacity .15s" }}
        />
      </svg>

      <div className="drop-glow relative z-10 flex flex-col items-center gap-3">
        {variant === "hero" ? (
          <>
            <motion.div
              aria-hidden="true"
              className="flex h-[68px] w-[68px] items-center justify-center rounded-pill border-2 border-dashed border-amber text-amber"
              animate={hot && !reduce ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={hot && !reduce ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : undefined}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </motion.div>
            {label ? <span className="text-body font-bold text-cream">{label}</span> : <span className="text-body font-bold text-cream">Add file</span>}
            <span className="text-small text-muted">{hint ?? "Drop or paste a PDF. Files never leave your device."}</span>
          </>
        ) : (
          <span id="dz-label" className="text-body font-bold text-cream">
            {label ?? "Add file"}
          </span>
        )}
        {variant === "inline" ? (
          <div>{children}</div>
        ) : (
          <div>{children}</div>
        )}
        <VisuallyHiddenPicker accept={accept} onFiles={handleFiles} />
      </div>
    </section>
  );
}

function VisuallyHiddenPicker(props: {
  accept: FileKind[];
  onFiles: (items: File[]) => void | Promise<void>;
}) {
  // The picker must open inside the same user activation: no dynamic import
  // inside the click handler. pickFiles is statically imported at the top.
  return (
    <button
      type="button"
      className="min-h-[44px] rounded-pill px-4 text-small font-bold text-amber underline-offset-4 hover:underline"
      onClick={() => {
        const acceptStr = props.accept.includes("image")
          ? "application/pdf,image/*"
          : props.accept.includes("text")
            ? "application/pdf,image/*,text/plain"
            : ".pdf,application/pdf";
        void pickFiles({ accept: acceptStr, multiple: true }).then(async (files) => props.onFiles(files));
      }}
    >
      Browse files
    </button>
  );
}

export const fileErrorCopy = fileErrors;
