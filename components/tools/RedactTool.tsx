"use client";

/**
 * True redaction: mark areas, then the worker renders each page, paints the
 * areas onto the pixels and rebuilds a fresh PDF from those images. The text
 * underneath is not copied into the output — unlike a black rectangle.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { DropZone } from "@/components/ui/DropZone";
import { Button, Chip } from "@/components/ui/core";
import { BusyCard, FileHead, StickyAction, ToolCard, ToolNote } from "@/components/tools/ToolParts";
import { useToolFiles } from "@/lib/store/docs";
import { useDoneStore } from "@/lib/store/done";
import { runRedact, runThumbs, readPageCount, CancelledError } from "@/lib/engine/client";
import type { RedactBox } from "@/lib/engine/types";
import { fileErrors, type FileItem } from "@/lib/files";
import { formatBytes, pluralPages } from "@/lib/format";
import { calmError } from "@/lib/errors";
import { toast } from "@/lib/store/toasts";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

type Draft = { x: number; y: number; w: number; h: number };

function normalizeDraft(a: { x: number; y: number }, b: { x: number; y: number }): Draft {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}

export function RedactTool() {
  const router = useRouter();
  const files = useToolFiles((s) => s.files.redact);
  const add = useToolFiles((s) => s.add);
  const clear = useToolFiles((s) => s.clear);
  const setResult = useDoneStore((s) => s.setResult);

  const [boxes, setBoxes] = useState<RedactBox[]>([]);
  const [page, setPage] = useState(1);
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [urls, setUrls] = useState<Record<number, string>>({});
  const [pageAR, setPageAR] = useState(1 / Math.SQRT2);
  const [thumbError, setThumbError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("");
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const urlsRef = useRef<Record<number, string>>({});

  const item: FileItem | undefined = files[0];
  const pageCount = item?.pageCount ?? 0;

  useEffect(() => {
    return () => {
      Object.values(urlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    if (!item || !pageCount) return;
    let alive = true;
    if (urlsRef.current[page]) {
      setUrls(urlsRef.current);
      return;
    }
    setThumbError(false);
    void (async () => {
      try {
        const out = await runThumbs({ file: item.file, pages: [page], width: 900 });
        if (!alive) return;
        const next = { ...urlsRef.current };
        for (const t of out) {
          next[t.page] = URL.createObjectURL(t.blob);
        }
        urlsRef.current = next;
        setUrls(next);
      } catch {
        if (alive) setThumbError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [item, page, pageCount]);

  const addFile = async (incoming: FileItem[]) => {
    clear("redact");
    const first = incoming[0];
    if (!first) return;
    try {
      const info = await readPageCount(first.file);
      if (info.encrypted) {
        toast.error(fileErrors.password);
        return;
      }
      if (!info.pageCount) {
        toast.error(fileErrors.unopenable);
        return;
      }
      Object.values(urlsRef.current).forEach((url) => URL.revokeObjectURL(url));
      urlsRef.current = {};
      setUrls({});
      setBoxes([]);
      setPage(1);
      setSelected(null);
      setDrawing(false);
      add("redact", [{ ...first, pageCount: info.pageCount }]);
      sound.play("gulp");
      haptic("success");
    } catch {
      toast.error(fileErrors.unopenable);
    }
  };

  const goToPage = (next: number) => {
    setPage(Math.max(1, Math.min(pageCount, next)));
    setSelected(null);
    setDrawing(false);
    setDraft(null);
    startRef.current = null;
  };

  const pointFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawing) return;
    e.preventDefault();
    const p = pointFromEvent(e);
    startRef.current = p;
    setDraft({ x: p.x, y: p.y, w: 0, h: 0 });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawing || !startRef.current) return;
    e.preventDefault();
    setDraft(normalizeDraft(startRef.current, pointFromEvent(e)));
  };

  const endDraw = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawing || !startRef.current) return;
    const p = pointFromEvent(e);
    const box = normalizeDraft(startRef.current, p);
    startRef.current = null;
    setDraft(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (box.w < 0.01 || box.h < 0.005) return;
    setBoxes((prev) => [...prev, { page, ...box }]);
    sound.play("toggle-on");
    haptic("success");
  };

  const addCentreBox = () => {
    setBoxes((prev) => [...prev, { page, x: 0.35, y: 0.46, w: 0.3, h: 0.06 }]);
    setSelected(boxes.length);
    sound.play("pop");
    haptic("tap");
  };

  const removeBox = (index: number) => {
    setBoxes((prev) => prev.filter((_, i) => i !== index));
    setSelected(null);
    sound.play("pop");
    haptic("tap");
  };

  const clearPage = () => {
    setBoxes((prev) => prev.filter((b) => b.page !== page));
    setSelected(null);
    sound.play("pop");
    haptic("tap");
  };

  const run = async () => {
    if (!item || !boxes.length) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setProgress(0);
    setLabel("Redacting");
    sound.startLoop("chew");
    haptic("tap");
    try {
      const out = await runRedact(
        { file: item.file, boxes, scale: 2, quality: 0.9 },
        {
          signal: controller.signal,
          onProgress: (p, l) => {
            setProgress(p);
            if (l) setLabel(l);
          },
        },
      );
      sound.stopLoop("chew");
      sound.play("success");
      haptic("success");
      const stem = item.name.replace(/\.pdf$/i, "");
      const pagesTouched = new Set(boxes.map((b) => b.page)).size;
      setResult({
        id: `redact-${Date.now()}`,
        tool: "redact",
        headline: "Redacted!",
        sentence: `${out.boxes} ${out.boxes === 1 ? "area" : "areas"} across ${pagesTouched} ${
          pagesTouched === 1 ? "page" : "pages"
        } removed. The output is a fresh, flattened PDF: the covered text is no longer inside it.`,
        beforeAfter: { before: item.size, after: out.blob.size, pages: out.pages },
        outputs: [{ blob: out.blob, name: `${stem}-redacted.pdf` }],
        at: Date.now(),
      });
      clear("redact");
      router.push("/done");
    } catch (e) {
      sound.stopLoop("chew");
      sound.play("error");
      haptic("error");
      if (e instanceof CancelledError) return;
      toast.error(calmError(e, "Could not redact this PDF. Try again."));
    } finally {
      setBusy(false);
      controllerRef.current = null;
    }
  };

  const pageBoxes = boxes.map((b, i) => ({ ...b, i })).filter((b) => b.page === page);
  const totalBoxes = boxes.length;
  const pagesTouched = new Set(boxes.map((b) => b.page)).size;

  return (
    <section aria-label="Redact a PDF" className="mt-8 flex flex-col gap-4">
      {!item ? (
        <DropZone
          accept={["pdf"]}
          label="Add a PDF"
          hint="Mark what must disappear, then build a clean copy. Nothing is uploaded."
          onFiles={(i) => void addFile(i)}
        />
      ) : (
        <>
          <FileHead
            name={item.name}
            meta={`${pageCount ? pluralPages(pageCount) : "PDF"} · ${formatBytes(item.size)}`}
            onRemove={() => clear("redact")}
          />

          <ToolCard className="!p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="surface"
                  size="md"
                  className="!min-h-[44px] !px-3"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  aria-label="Previous page"
                >
                  ‹
                </Button>
                <span className="tnum text-[13px] font-bold text-cream">
                  Page {page} of {pageCount}
                </span>
                <Button
                  variant="surface"
                  size="md"
                  className="!min-h-[44px] !px-3"
                  disabled={page >= pageCount}
                  onClick={() => goToPage(page + 1)}
                  aria-label="Next page"
                >
                  ›
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip
                  label={drawing ? "Drawing: on" : "Draw a box"}
                  selected={drawing}
                  onClick={() => {
                    setDrawing((d) => !d);
                    setDraft(null);
                    startRef.current = null;
                    setSelected(null);
                  }}
                />
                <Button variant="surface" size="md" className="!min-h-[44px] !px-3" onClick={addCentreBox}>
                  Add box
                </Button>
                <Button
                  variant="surface"
                  size="md"
                  className="!min-h-[44px] !px-3"
                  disabled={!pageBoxes.length}
                  onClick={clearPage}
                >
                  Clear page
                </Button>
              </div>
            </div>
            <p id="redact-help" className="mt-2 text-small text-muted" aria-live="polite">
              {drawing
                ? "Drag across the page to mark an area."
                : pageBoxes.length
                  ? `${pageBoxes.length} ${pageBoxes.length === 1 ? "area" : "areas"} on this page. Tap a box to remove it.`
                  : "Turn on Draw a box, then drag over anything private."}
            </p>
          </ToolCard>

          <div className="rounded-card-l bg-ink p-2">
            <div
              ref={overlayRef}
              className="relative mx-auto w-full max-w-[720px] touch-none select-none overflow-hidden rounded-card bg-cream"
              style={{ aspectRatio: String(pageAR), touchAction: drawing ? "none" : "pan-y" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDraw}
              onPointerCancel={(e) => {
                startRef.current = null;
                setDraft(null);
                if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
              }}
              aria-label={`Page ${page} redaction preview`}
              aria-describedby="redact-help"
              role="group"
            >
              {urls[page] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urls[page]}
                  alt={`Page ${page}`}
                  draggable={false}
                  className="h-full w-full object-contain"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth && img.naturalHeight) setPageAR(img.naturalWidth / img.naturalHeight);
                  }}
                />
              ) : (
                <span className="skeleton absolute inset-0 block" aria-hidden="true" />
              )}
              {thumbError ? (
                <p className="absolute inset-x-4 top-4 rounded-card bg-ink/90 p-3 text-center text-small text-cream">
                  The preview could not render, but redaction can still run.
                </p>
              ) : null}

              {pageBoxes.map((b) => (
                <motion.button
                  key={b.i}
                  type="button"
                  aria-label={`Remove redaction box ${b.i + 1} on page ${page}`}
                  className={`absolute border-2 ${
                    selected === b.i ? "border-amber" : "border-white/70"
                  } bg-ink/90`}
                  style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (drawing) return;
                    removeBox(b.i);
                  }}
                  disabled={drawing}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span className="sr-only">Redacted area</span>
                </motion.button>
              ))}

              {draft ? (
                <span
                  className="pointer-events-none absolute border-2 border-amber bg-ink/80"
                  style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, width: `${draft.w * 100}%`, height: `${draft.h * 100}%` }}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          </div>

          <ToolNote>
            Redaction rebuilds the pages as images. The covered words are gone from the file, not hidden under a
            rectangle. The output is flattened, so its text will not be selectable and its size may grow.
          </ToolNote>

          <p className="tnum text-small text-muted" aria-live="polite">
            {totalBoxes
              ? `${totalBoxes} ${totalBoxes === 1 ? "area" : "areas"} on ${pagesTouched} ${
                  pagesTouched === 1 ? "page" : "pages"
                }.`
              : "No areas marked yet."}
          </p>

          {busy ? (
            <BusyCard progress={progress} label={label || "Redacting…"} onCancel={() => controllerRef.current?.abort()} />
          ) : null}

          <StickyAction>
            <Button disabled={!totalBoxes || busy} className="w-full" size="lg" onClick={() => void run()} aria-busy={busy}>
              {busy
                ? `Redacting… ${Math.round(progress * 100)}%`
                : `Redact and download${totalBoxes ? ` (${totalBoxes})` : ""}`}
            </Button>
          </StickyAction>
        </>
      )}
    </section>
  );
}
