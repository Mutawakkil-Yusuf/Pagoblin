"use client";

/**
 * Batch queue: many PDFs, one operation, one zip. Files run one at a time so
 * memory stays bounded on phones; a failure on one file is reported and the
 * rest continue. Nothing is uploaded.
 */
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { DropZone } from "@/components/ui/DropZone";
import { Button, Chip } from "@/components/ui/core";
import { BusyCard, StickyAction, ToolCard, ToolNote } from "@/components/tools/ToolParts";
import { IconClose } from "@/components/ui/Icons";
import { useToolFiles } from "@/lib/store/docs";
import { useDoneStore } from "@/lib/store/done";
import {
  runCompress,
  runPdfToImage,
  runPdfText,
  readPageCount,
  CancelledError,
} from "@/lib/engine/client";
import type { DoneBlob } from "@/lib/store/done";
import { fileErrors, type FileItem } from "@/lib/files";
import { formatBytes, pluralPages } from "@/lib/format";
import { calmError } from "@/lib/errors";
import { toast } from "@/lib/store/toasts";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

type BatchOp = "compress" | "images" | "text";
type ImageFormat = "jpg" | "png";
type TextFormat = "text" | "markdown";

const OPS: { key: BatchOp; label: string; hint: string }[] = [
  { key: "compress", label: "Compress", hint: "Squeeze every PDF to a target" },
  { key: "images", label: "PDF → images", hint: "One image per page" },
  { key: "text", label: "PDF → text", hint: "Text or Markdown per file" },
];

const TARGETS: { label: string; bytes: number | null }[] = [
  { label: "1 MB", bytes: 1024 * 1024 },
  { label: "2 MB", bytes: 2 * 1024 * 1024 },
  { label: "5 MB", bytes: 5 * 1024 * 1024 },
  { label: "Smallest", bytes: null },
];

export function BatchTool() {
  const router = useRouter();
  const files = useToolFiles((s) => s.files.batch);
  const add = useToolFiles((s) => s.add);
  const remove = useToolFiles((s) => s.remove);
  const clear = useToolFiles((s) => s.clear);
  const setResult = useDoneStore((s) => s.setResult);

  const [op, setOp] = useState<BatchOp>("compress");
  const [target, setTarget] = useState<number | null>(TARGETS[1].bytes);
  const [imageFormat, setImageFormat] = useState<ImageFormat>("jpg");
  const [textFormat, setTextFormat] = useState<TextFormat>("text");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("");
  const [current, setCurrent] = useState(0);
  const [failed, setFailed] = useState<{ name: string; message: string }[]>([]);
  const [stopping, setStopping] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const stopRef = useRef(false);

  const addFiles = async (incoming: FileItem[]) => {
    const fresh: FileItem[] = [];
    for (const item of incoming) {
      try {
        const info = await readPageCount(item.file);
        if (info.encrypted) {
          toast.error(`${item.name}: ${fileErrors.password}`);
          continue;
        }
        if (!info.pageCount) {
          toast.error(`${item.name}: ${fileErrors.unopenable}`);
          continue;
        }
        fresh.push({ ...item, pageCount: info.pageCount });
      } catch {
        toast.error(`${item.name}: ${fileErrors.unopenable}`);
      }
    }
    if (fresh.length) {
      add("batch", fresh);
      sound.play("gulp");
      haptic("success");
    }
  };

  const run = async () => {
    if (!files.length) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    stopRef.current = false;
    setStopping(false);
    setBusy(true);
    setProgress(0);
    setCurrent(0);
    setFailed([]);
    sound.startLoop("chew");
    haptic("tap");
    const outputs: DoneBlob[] = [];
    const errors: { name: string; message: string }[] = [];
    let pages = 0;
    let processed = 0;

    for (let i = 0; i < files.length; i++) {
      if (controller.signal.aborted || stopRef.current) break;
      const item = files[i];
      setCurrent(i);
      setLabel(`${item.name} (${i + 1} of ${files.length})`);
      try {
        const stem = item.name.replace(/\.pdf$/i, "");
        if (op === "compress") {
          const out = await runCompress(
            { file: item.file, fileName: item.name, target, engine: "auto" },
            {
              signal: controller.signal,
              onProgress: (p, l) => {
                setProgress((i + p) / files.length);
                if (l) setLabel(`${item.name}: ${l}`);
              },
            },
          );
          outputs.push({ blob: out.blob, name: `${stem}-squeezed.pdf` });
        } else if (op === "images") {
          const out = await runPdfToImage(
            { file: item.file, format: imageFormat, quality: 0.92, scale: 2, pages: "all" },
            {
              signal: controller.signal,
              onProgress: (p, l) => {
                setProgress((i + p) / files.length);
                if (l) setLabel(`${item.name}: ${l}`);
              },
            },
          );
          for (const b of out.blobs) outputs.push({ blob: b.blob, name: `${stem}-${b.name}.${imageFormat}` });
        } else {
          const out = await runPdfText(
            { file: item.file, pages: "all", format: textFormat },
            {
              signal: controller.signal,
              onProgress: (p, l) => {
                setProgress((i + p) / files.length);
                if (l) setLabel(`${item.name}: ${l}`);
              },
            },
          );
          if (out.chars === 0) {
            errors.push({ name: item.name, message: "No selectable text; it looks like a scan." });
          } else {
            const ext = textFormat === "markdown" ? "md" : "txt";
            outputs.push({ blob: out.blob, name: `${stem}.${ext}` });
          }
        }
        pages += item.pageCount ?? 0;
        processed += 1;
        setProgress((i + 1) / files.length);
      } catch (e) {
        if (e instanceof CancelledError) break;
        errors.push({ name: item.name, message: calmError(e, "Could not finish this file.") });
        processed += 1;
      }
    }

    sound.stopLoop("chew");
    const stopped = (stopRef.current || controller.signal.aborted) && processed < files.length;
    if (!outputs.length) {
      if (stopped) {
        sound.play("pop");
        toast.info("Stopped. Nothing finished, so there is nothing to download.");
      } else {
        sound.play("error");
        haptic("error");
        setFailed(errors);
        toast.error(errors[0] ? `${errors[0].name}: ${errors[0].message}` : "No files could be processed.");
      }
      setBusy(false);
      setStopping(false);
      controllerRef.current = null;
      return;
    }

    sound.play("success");
    haptic("success");
    setFailed(errors);
    const failedText = errors.length ? ` ${errors.length} could not be finished.` : "";
    const processedLabel = stopped ? `${processed} of ${files.length}` : `${files.length}`;
    setResult({
      id: `batch-${Date.now()}`,
      tool: "batch",
      headline: stopped ? "Batch stopped!" : "Batch done!",
      sentence: `${processedLabel} ${files.length === 1 ? "PDF" : "PDFs"} through ${
        op === "compress" ? "compression" : op === "images" ? "image export" : "text extraction"
      } on this device. ${outputs.length} ${outputs.length === 1 ? "file" : "files"} ready.${failedText}${
        stopped ? " The rest of the queue was left alone." : ""
      }`,
      beforeAfter: { pages, count: outputs.length },
      outputs,
      zipped: outputs.length > 1,
      at: Date.now(),
    });
    clear("batch");
    router.push("/done");
    setBusy(false);
    setStopping(false);
    controllerRef.current = null;
  };

  const totalBytes = files.reduce((n, f) => n + f.size, 0);
  const totalPages = files.reduce((n, f) => n + (f.pageCount ?? 0), 0);

  return (
    <section aria-label="Batch PDF queue" className="mt-8 flex flex-col gap-4">
      <DropZone
        accept={["pdf"]}
        label={files.length ? "Add more PDFs" : "Add PDFs"}
        hint="Drop several PDFs. They run one at a time and come back as a zip."
        onFiles={(i) => void addFiles(i)}
        variant={files.length ? "inline" : "hero"}
      />

      {files.length ? (
        <>
          <ToolCard className="!p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-h3 font-extrabold">
                {files.length} {files.length === 1 ? "file" : "files"} queued
              </h2>
              <span className="tnum text-small text-muted">
                {totalPages ? pluralPages(totalPages) : "PDF"} · {formatBytes(totalBytes)}
              </span>
            </div>
            <ul className="mt-3 flex flex-col gap-2" aria-label="Queued files">
              <AnimatePresence initial={false}>
                {files.map((item, index) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="flex items-center gap-2 rounded-phone-chip bg-ink/50 px-3 py-2"
                  >
                    <span className="tnum w-5 shrink-0 text-[11px] font-bold text-muted">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-cream">{item.name}</span>
                    <span className="tnum shrink-0 text-[11px] text-muted">
                      {item.pageCount ? pluralPages(item.pageCount) : "PDF"} · {formatBytes(item.size)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[22px] bg-line/60 text-cream"
                      disabled={busy}
                      onClick={() => {
                        remove("batch", item.id);
                        sound.play("pop");
                        haptic("tap");
                      }}
                    >
                      <IconClose width={14} height={14} />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <button
              type="button"
              className="mt-3 min-h-[44px] rounded-pill px-2 text-small font-bold text-amber underline underline-offset-4 disabled:opacity-50"
              disabled={busy}
              onClick={() => {
                clear("batch");
                setFailed([]);
                sound.play("pop");
              }}
            >
              Clear queue
            </button>
          </ToolCard>

          <ToolCard>
            <h2 className="font-display text-h3 font-extrabold">One job for every file</h2>
            <div className="mt-2 flex flex-col gap-2">
              {OPS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  aria-pressed={op === o.key}
                  disabled={busy}
                  onClick={() => {
                    setOp(o.key);
                    sound.play("pop");
                    haptic("tap");
                  }}
                  className={`flex min-h-[56px] items-center justify-between gap-3 rounded-phone-chip px-3.5 py-2.5 text-left ${
                    op === o.key ? "bg-orange text-ink" : "border-2 border-line bg-surface text-cream"
                  }`}
                >
                  <span>
                    <span className="block text-[15px] font-bold">{o.label}</span>
                    <span className={`block text-[11px] ${op === o.key ? "text-ink/70" : "text-muted"}`}>{o.hint}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${
                      op === o.key ? "bg-ink text-orange" : "border-2 border-line"
                    }`}
                  >
                    {op === o.key ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>

            {op === "compress" ? (
              <div className="mt-4">
                <p className="text-[12px] font-bold text-cream">Target size per file</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TARGETS.map((t) => (
                    <Chip key={t.label} label={t.label} selected={target === t.bytes} onClick={() => setTarget(t.bytes)} />
                  ))}
                </div>
              </div>
            ) : null}

            {op === "images" ? (
              <div className="mt-4">
                <p className="text-[12px] font-bold text-cream">Image format</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Chip label="JPG" selected={imageFormat === "jpg"} onClick={() => setImageFormat("jpg")} />
                  <Chip label="PNG" selected={imageFormat === "png"} onClick={() => setImageFormat("png")} />
                </div>
                <p className="mt-1.5 text-small text-muted">Every page becomes one image, named after its PDF.</p>
              </div>
            ) : null}

            {op === "text" ? (
              <div className="mt-4">
                <p className="text-[12px] font-bold text-cream">Text format</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Chip label="Plain text" selected={textFormat === "text"} onClick={() => setTextFormat("text")} />
                  <Chip label="Markdown" selected={textFormat === "markdown"} onClick={() => setTextFormat("markdown")} />
                </div>
                <p className="mt-1.5 text-small text-muted">Scans without a text layer are reported, not silently skipped.</p>
              </div>
            ) : null}

            <ToolNote className="mt-4">
              Files run one at a time on this device. Leave the tab open until the queue finishes.
            </ToolNote>
          </ToolCard>

          {failed.length ? (
            <div className="rounded-card-l border-2 border-amber bg-amber/10 p-4">
              <p className="text-[13px] font-bold text-cream">Some files need another look</p>
              <ul className="mt-2 flex flex-col gap-1">
                {failed.map((f) => (
                  <li key={f.name} className="text-small text-muted">
                    <span className="font-bold text-cream">{f.name}:</span> {f.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {busy ? (
            <BusyCard
              progress={progress}
              label={label || "Working…"}
              onCancel={() => {
                if (stopRef.current) controllerRef.current?.abort();
                else {
                  stopRef.current = true;
                  setStopping(true);
                }
              }}
              cancelLabel={stopping ? "Stop now" : "Stop after this file"}
            />
          ) : null}

          <StickyAction>
            <Button disabled={busy || !files.length} className="w-full" size="lg" onClick={() => void run()} aria-busy={busy}>
              {busy
                ? `Batch ${Math.min(current + 1, files.length)} of ${files.length} · ${Math.round(progress * 100)}%`
                : `Run ${files.length} ${files.length === 1 ? "file" : "files"}`}
            </Button>
          </StickyAction>
        </>
      ) : (
        <ToolCard>
          <h2 className="font-display text-h3 font-extrabold">One queue, one zip</h2>
          <p className="mt-1 text-body text-muted">
            Compress, export images or extract text from many PDFs without repeating the same steps. Everything stays on
            this device.
          </p>
          <ToolNote className="mt-3">Add one or more PDFs to start. You can mix sizes and page counts.</ToolNote>
        </ToolCard>
      )}
    </section>
  );
}
