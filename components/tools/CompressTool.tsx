"use client";

/**
 * Compress tool (screen 04): size targets 1 MB / 2 MB / 5 MB / smallest.
 * No fabricated estimates — Pip tries real recipes (Ghostscript rasterisation
 * at several DPIs, then the flatten fallback) and the done screen shows the
 * sizes it actually measured.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Pip } from "@/components/pip/Pip";
import { DropZone } from "@/components/ui/DropZone";
import { Button, Chip } from "@/components/ui/core";
import { IconClose } from "@/components/ui/Icons";
import { useToolFiles } from "@/lib/store/docs";
import { useDoneStore, defaultHeadline } from "@/lib/store/done";
import { EngineError, CancelledError, readPageCount, runCompress } from "@/lib/engine/client";
import { fileErrors, type FileItem } from "@/lib/files";
import { formatBytes, pluralPages } from "@/lib/format";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { toast } from "@/lib/store/toasts";

const TARGETS: { label: string; bytes: number | null }[] = [
  { label: "1 MB", bytes: 1024 * 1024 },
  { label: "2 MB", bytes: 2 * 1024 * 1024 },
  { label: "5 MB", bytes: 5 * 1024 * 1024 },
  { label: "Smallest", bytes: null },
];

export function CompressTool(props: { initialTarget?: number | null }) {
  const { initialTarget } = props;
  const files = useToolFiles((s) => s.files.compress);
  const add = useToolFiles((s) => s.add);
  const remove = useToolFiles((s) => s.remove);
  const clear = useToolFiles((s) => s.clear);
  const pageCountMap = useToolFiles((s) => s.pageCount);
  const setPageCount = useToolFiles((s) => s.setPageCount);
  const setResult = useDoneStore((s) => s.setResult);
  const router = useRouter();

  const [target, setTarget] = useState<number | null>(
    initialTarget === undefined ? TARGETS[1].bytes : initialTarget,
  );
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

  const item: FileItem | undefined = files[0];
  const pageCount = item ? (pageCountMap[item.id] ?? null) : null;

  useEffect(() => {
    if (!item) return;
    void readPageCount(item.file)
      .then(({ pageCount: n, encrypted }) => {
        if (encrypted) {
          toast.error(fileErrors.password);
          remove("compress", item.id);
          return;
        }
        if (n) setPageCount(item.id, n);
      })
      .catch(() => {
        toast.error(fileErrors.unopenable);
        remove("compress", item.id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const pickTarget = (bytes: number | null) => {
    setTarget(bytes);
  };

  const run = async () => {
    if (!item) return;
    setBusy(true);
    setProgress(0);
    sound.startLoop("chew");
    haptic("tap");
    try {
      const buffer = await item.file.arrayBuffer();
      const stem = item.name.replace(/\.pdf$/i, "");
      const out = await runCompress(
        { file: buffer, fileName: item.name, target, engine: "auto" },
        {
          onProgress: (p, label) => {
            setProgress(p);
            if (label) setProgressLabel(label);
          },
        },
      );
      sound.stopLoop("chew");
      sound.play("success");
      haptic("success");
      const smallerPercent = out.after < out.before ? Math.round((1 - out.after / out.before) * 100) : 0;
      setResult({
        id: `compress-${Date.now()}`,
        tool: "compress",
        headline: defaultHeadline("compress", { reached: out.reached }),
        sentence:
          `${item.name}: ${formatBytes(out.before)} → ${formatBytes(out.after)}` +
          (smallerPercent > 0 ? ` (${smallerPercent}% smaller).` : " — already small, that is the size."),
        beforeAfter: { before: out.before, after: out.after, pages: pageCount ?? undefined },
        outputs: [{ blob: out.blob, name: `${stem}-squeezed.pdf` }],
        at: Date.now(),
      });
      clear("compress");
      router.push("/done");
    } catch (e) {
      sound.stopLoop("chew");
      sound.play("error");
      haptic("error");
      setBusy(false);
      if (e instanceof CancelledError) return;
      if (e instanceof EngineError && e.code === "password") {
        toast.error(fileErrors.password);
        return;
      }
      if (e instanceof EngineError && e.code === "oom") {
        toast.error("That is too much for this device. Try a smaller file.");
        return;
      }
      toast.error("Something went wrong while squeezing. Try again.");
    }
  };

  const targetText = target == null ? "as small as it goes" : `about ${formatBytes(target)}`;

  return (
    <section aria-label="Compress tool" className="mt-8 flex flex-col gap-4">
      {files.length === 0 ? (
        <DropZone
          accept={["pdf"]}
          label="Add file"
          hint="Drop your PDF here. Nothing is uploaded."
          onFiles={(i) => {
            clear("compress");
            add("compress", i);
          }}
        />
      ) : (
        <>
          {/* File head, as screen 04 */}
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between rounded-phone-chip bg-amber px-3.5 py-3 text-ink"
          >
            <span className="min-w-0 flex-1 truncate font-bold text-[15px]">{item.name}</span>
            <span className="tnum mr-1 shrink-0 text-[12px]">
              {pageCount != null ? pluralPages(pageCount) : "counting…"} · {formatBytes(item.size)}
            </span>
            <button
              type="button"
              aria-label="Remove file"
              className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[22px] bg-ink/10 text-ink"
              onClick={() => {
                clear("compress");
                sound.play("pop");
              }}
            >
              <IconClose width={16} height={16} />
            </button>
          </motion.div>

          <h2 className="font-display text-h2 font-extrabold">Squeeze it to</h2>
          <div className="flex flex-wrap gap-2">
            {TARGETS.map((t) => (
              <Chip
                key={t.label}
                label={t.label}
                selected={target === t.bytes}
                onClick={() => pickTarget(t.bytes)}
              />
            ))}
          </div>

          {busy ? (
            <div className="rounded-card-l bg-surface p-6 text-center" role="status" aria-live="polite">
              <Pip mood="chewing" size={120} className="mx-auto" />
              <p className="mt-3 text-body text-muted">
                {progressLabel || "Chewing…"} {Math.round(progress * 100)}%
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-card-l bg-surface p-5"
            >
              <p className="font-display text-h3 font-extrabold">Target: {targetText}</p>
              <p className="mt-1.5 text-body text-muted">
                Pip tries a few recipes and keeps the best that fits. You see real sizes
                before download — no guesses.
              </p>
              <p className="mt-3 flex items-center gap-2 text-small text-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="4" y="10" width="16" height="11" rx="3" />
                  <path d="M8 10V7a4 4 0 018 0v3" />
                </svg>
                Processed on this device
              </p>
            </motion.div>
          )}

          <div className="sticky bottom-28 z-10 md:bottom-8">
            <Button disabled={busy} className="w-full" size="lg" onClick={() => void run()} aria-busy={busy}>
              {busy ? `Squeezing… ${Math.round(progress * 100)}%` : "Squeeze and download"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
