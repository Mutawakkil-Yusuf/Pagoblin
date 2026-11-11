"use client";

/**
 * Split tool (screen 06): three modes.
 * - Pick pages: tap thumbnails (orange ring + check bubble, as designed).
 * - Every page: one PDF per page, zipped on download.
 * - Ranges: "1-3, 5, 8-" with live validation; numbers resolve like the parser.
 * Selection is honest: the status line echoes exactly what goes out.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Pip } from "@/components/pip/Pip";
import { DropZone } from "@/components/ui/DropZone";
import { Button, Chip } from "@/components/ui/core";
import { IconClose } from "@/components/ui/Icons";
import { ThumbGrid } from "@/components/tools/ThumbGrid";
import { useToolFiles } from "@/lib/store/docs";
import { useDoneStore } from "@/lib/store/done";
import {
  EngineError,
  CancelledError,
  readPageCount,
  runSplit,
} from "@/lib/engine/client";
import type { SplitInput } from "@/lib/engine/types";
import { fileErrors, type FileItem } from "@/lib/files";
import { formatBytes, pluralPages } from "@/lib/format";
import { parseRanges, pagesToRanges } from "@/lib/ranges";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { toast } from "@/lib/store/toasts";

type Mode = "pick" | "every" | "ranges";

const MODES: { key: Mode; label: string }[] = [
  { key: "pick", label: "Pick pages" },
  { key: "every", label: "Every page" },
  { key: "ranges", label: "Ranges" },
];

export function SplitTool() {
  const files = useToolFiles((s) => s.files.split);
  const add = useToolFiles((s) => s.add);
  const remove = useToolFiles((s) => s.remove);
  const clear = useToolFiles((s) => s.clear);
  const pageCountMap = useToolFiles((s) => s.pageCount);
  const setPageCount = useToolFiles((s) => s.setPageCount);
  const setResult = useDoneStore((s) => s.setResult);
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("pick");
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [ranges, setRanges] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

  const item: FileItem | undefined = files[0];
  const pageCount = item ? (pageCountMap[item.id] ?? null) : null;
  const parsed = useMemo(
    () => (pageCount ? parseRanges(ranges, pageCount) : null),
    [ranges, pageCount],
  );

  useEffect(() => {
    // Fresh file, fresh choices.
    setPicked(new Set());
    setRanges("");
    if (!item) return;
    void readPageCount(item.file)
      .then(({ pageCount: n, encrypted }) => {
        if (encrypted) {
          toast.error(fileErrors.password);
          remove("split", item.id);
          return;
        }
        if (n) setPageCount(item.id, n);
      })
      .catch(() => {
        toast.error(fileErrors.unopenable);
        remove("split", item.id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const togglePage = (page: number) => {
    sound.play("pop");
    haptic("tap");
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(page)) next.delete(page);
      else next.add(page);
      return next;
    });
  };

  const chosenRanges: { start: number; end: number }[] = useMemo(() => {
    if (!parsed) return [];
    const out: { start: number; end: number }[] = [];
    for (const t of parsed.tokens) {
      if (t.type === "range") out.push({ start: t.start, end: t.end });
      else if (t.type === "page") out.push({ start: t.page, end: t.page });
    }
    return out;
  }, [parsed]);

  const ready =
    !busy &&
    pageCount != null &&
    (mode === "every" ||
      (mode === "pick" && picked.size > 0) ||
      (mode === "ranges" && parsed?.ok && chosenRanges.length > 0));

  const status =
    mode === "pick"
      ? pageCount == null
        ? "Counting the pages…"
        : picked.size === 0
          ? "Tap the pages to keep."
          : `${picked.size} of ${pageCount} pages selected`
      : mode === "every"
        ? "One PDF per page, packed as a zip."
        : parsed == null
          ? ""
          : parsed.ok
            ? chosenRanges.length
              ? `${pagesToRanges(
                  chosenRanges.flatMap((r) => Array.from({ length: r.end - r.start + 1 }, (_, i) => r.start + i)),
                )} — one PDF per range.`
              : "Type a page or a range."
            : "";

  const run = async () => {
    if (!item || pageCount == null) return;
    setBusy(true);
    setProgress(0);
    sound.startLoop("chew");
    haptic("tap");
    try {
      const buffer = await item.file.arrayBuffer();
      const stem = item.name.replace(/\.pdf$/i, "");
      const input: SplitInput =
        mode === "pick"
          ? { mode: "pick", file: buffer, pages: [...picked].sort((a, b) => a - b), pageCount }
          : mode === "every"
            ? ({ mode: "every", file: buffer, pageCount } satisfies SplitInput)
            : { mode: "ranges", file: buffer, ranges: chosenRanges };

      const out = await runSplit(input, {
        onProgress: (p, label) => {
          setProgress(p);
          if (label) setProgressLabel(label);
        },
      });
      sound.stopLoop("chew");
      sound.play("success");
      haptic("success");

      const sentence =
        mode === "pick"
          ? `${pluralPages(picked.size)} into one PDF (${formatBytes(out.blobs[0].blob.size)}).`
          : mode === "every"
            ? `${pluralPages(pageCount)}, one PDF each — a zip comes out.`
            : `${out.count} ${out.count === 1 ? "range" : "ranges"}, one PDF each — a zip comes out.`;
      setResult({
        id: `split-${Date.now()}`,
        tool: "split",
        headline: "Split!",
        sentence: `${stem}: ${sentence}`,
        beforeAfter: { pages: pageCount, count: out.count },
        outputs: out.blobs.map((b) => ({ blob: b.blob, name: `${stem}-${b.name}.pdf` })),
        zipped: out.blobs.length > 1,
        at: Date.now(),
      });
      clear("split");
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
        toast.error("That is too much for this device. Try fewer pages.");
        return;
      }
      toast.error("Something went wrong while splitting. Try again.");
    }
  };

  return (
    <section aria-label="Split tool" className="mt-8 flex flex-col gap-4">
      {files.length === 0 ? (
        <DropZone accept={["pdf"]} label="Add file" hint="Drop your PDF here. Nothing is uploaded." onFiles={(i) => { clear("split"); add("split", i); }} />
      ) : (
        <>
          {/* File head, as screen 05/06 */}
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
                clear("split");
                sound.play("pop");
              }}
            >
              <IconClose width={16} height={16} />
            </button>
          </motion.div>

          {/* Mode switch, flex-1 as designed */}
          <div className="flex gap-2" role="tablist" aria-label="Split mode">
            {MODES.map((m) => (
              <Chip key={m.key} label={m.label} selected={mode === m.key} onClick={() => setMode(m.key)} className="flex-1" />
            ))}
          </div>

          {busy ? (
            <div className="rounded-card-l bg-surface p-5 text-center" role="status" aria-live="polite">
              <Pip mood="chewing" size={120} className="mx-auto" />
              <p className="mt-3 text-body text-muted">
                {progressLabel || "Chewing…"} {Math.round(progress * 100)}%
              </p>
            </div>
          ) : (
            <>
              {mode === "pick" && pageCount != null && (
                <ThumbGrid pageCount={pageCount} picked={picked} onToggle={togglePage} file={item} />
              )}
              {mode === "ranges" && (
                <div>
                  <label htmlFor="split-ranges" className="sr-only">
                    Ranges, like 1-3, 5, 8-
                  </label>
                  <input
                    id="split-ranges"
                    autoComplete="off"
                    inputMode="text"
                    value={ranges}
                    onChange={(e) => setRanges(e.target.value)}
                    placeholder="1-3, 5, 8-"
                    className={`w-full rounded-card-l border-2 bg-surface px-4 py-3.5 font-bold text-cream outline-none ${
                      ranges && parsed?.ok === false ? "border-orange" : "border-line focus:border-amber"
                    }`}
                  />
                </div>
              )}
              <p className="tnum min-h-[20px] text-[13px] text-muted" aria-live="polite">
                {status}
              </p>
            </>
          )}

          <div className="sticky bottom-28 z-10 md:bottom-8">
            <Button
              disabled={!ready}
              className="w-full"
              size="lg"
              onClick={() => void run()}
              aria-busy={busy}
            >
              {busy
                ? `Splitting… ${Math.round(progress * 100)}%`
                : mode === "every"
                  ? "Split every page"
                  : mode === "pick"
                    ? picked.size > 0
                      ? `Split ${picked.size} ${picked.size === 1 ? "page" : "pages"}`
                      : "Split"
                    : "Split"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
