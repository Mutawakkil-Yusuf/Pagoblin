"use client";

/**
 * Convert tool (screen 08): three tabs.
 * - PDF → image: PNG / JPG / WebP, high quality; multipage gives a zip.
 * - Image → PDF: photos become one PDF, images fitted as pages.
 * - Text → PDF: typed text becomes a clean document.
 * A locked "Soon" chip explains Word/PowerPoint: they would need a server,
 * so they wait for Pro — the copy says exactly that.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Pip } from "@/components/pip/Pip";
import { DropZone } from "@/components/ui/DropZone";
import { Button, Chip } from "@/components/ui/core";
import { IconClose } from "@/components/ui/Icons";
import { useToolFiles } from "@/lib/store/docs";
import { useDoneStore } from "@/lib/store/done";
import {
  EngineError,
  CancelledError,
  readPageCount,
  runPdfToImage,
  runImageToPdf,
  runTextToPdf,
} from "@/lib/engine/client";
import { fileErrors, type FileItem } from "@/lib/files";
import { formatBytes, pluralPages } from "@/lib/format";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { toast } from "@/lib/store/toasts";

type Tab = "pdf-to-image" | "image-to-pdf" | "text-to-pdf";

const TABS: { key: Tab; label: string }[] = [
  { key: "pdf-to-image", label: "PDF to image" },
  { key: "image-to-pdf", label: "Image to PDF" },
  { key: "text-to-pdf", label: "Text to PDF" },
];

const FORMATS: { key: "png" | "jpg" | "webp"; label: string }[] = [
  { key: "png", label: "PNG" },
  { key: "jpg", label: "JPG" },
  { key: "webp", label: "WebP" },
];

export function ConvertTool(props: { initialTab?: Tab; initialFormat?: "png" | "jpg" | "webp" }) {
  const { initialTab, initialFormat } = props;
  const files = useToolFiles((s) => s.files.convert);
  const add = useToolFiles((s) => s.add);
  const remove = useToolFiles((s) => s.remove);
  const clear = useToolFiles((s) => s.clear);
  const pageCountMap = useToolFiles((s) => s.pageCount);
  const setPageCount = useToolFiles((s) => s.setPageCount);
  const setResult = useDoneStore((s) => s.setResult);
  const router = useRouter();

  const [tab, setTab] = useState<Tab>(initialTab ?? "pdf-to-image");
  const [format, setFormat] = useState<"png" | "jpg" | "webp">(initialFormat ?? "jpg");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

  // First PDF file, for the PDF→image tab.
  const pdfItem = files.find((f) => f.kind === "pdf");
  const pdfPages: number | null = pdfItem ? (pageCountMap[pdfItem.id] ?? null) : null;
  const imageItems = files.filter((f) => f.kind === "image");
  const textItem = files.find((f) => f.kind === "text");

  useEffect(() => {
    if (!pdfItem) return;
    void readPageCount(pdfItem.file)
      .then(({ pageCount: n, encrypted }) => {
        if (encrypted) {
          toast.error(fileErrors.password);
          remove("convert", pdfItem.id);
          return;
        }
        if (n) setPageCount(pdfItem.id, n);
      })
      .catch(() => {
        toast.error(fileErrors.unopenable);
        remove("convert", pdfItem.id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfItem?.id]);

  const ingest = (items: FileItem[]) => {
    add("convert", items);
    // Route the first item to the tab its kind belongs to.
    const k = items[0]?.kind;
    if (k === "pdf" && tab !== "pdf-to-image") setTab("pdf-to-image");
    if (k === "image" && tab !== "image-to-pdf") setTab("image-to-pdf");
    if (k === "text" && tab !== "text-to-pdf") setTab("text-to-pdf");
  };

  const clearAll = () => {
    clear("convert");
    setText("");
    sound.play("pop");
  };

  const headlineFor = (t: Tab): "convert" | "image-to-pdf" | "text-to-pdf" =>
    t === "pdf-to-image" ? "convert" : t === "image-to-pdf" ? "image-to-pdf" : "text-to-pdf";

  const run = async () => {
    setBusy(true);
    setProgress(0);
    sound.startLoop("chew");
    haptic("tap");
    try {
      if (tab === "pdf-to-image" && pdfItem) {
        const buffer = await pdfItem.file.arrayBuffer();
        const stem = pdfItem.name.replace(/\.pdf$/i, "");
        const out = await runPdfToImage(
          { file: buffer, format, quality: 0.92, scale: 2, pages: "all" },
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
        setResult({
          id: `pdf2img-${Date.now()}`,
          tool: "pdf-to-image",
          headline: "Converted!",
          sentence: `${stem}: ${pluralPages(out.blobs.length)} as ${format.toUpperCase()} — a zip comes out.`,
          beforeAfter: { pages: out.blobs.length },
          outputs: out.blobs.map((b) => ({ blob: b.blob, name: `${stem}-${b.name}.${format}` })),
          zipped: out.blobs.length > 1,
          at: Date.now(),
        });
      } else if (tab === "image-to-pdf" && imageItems.length) {
        const images = [];
        for (const im of imageItems) {
          images.push({ name: im.name, buffer: await im.file.arrayBuffer(), type: im.file.type || "image/jpeg" });
        }
        const out = await runImageToPdf(
          { images, pageSize: "fit", margin: 6 },
          { onProgress: (p, label) => { setProgress(p); if (label) setProgressLabel(label); } },
        );
        sound.stopLoop("chew");
        sound.play("success");
        haptic("success");
        setResult({
          id: `img2pdf-${Date.now()}`,
          tool: "image-to-pdf",
          headline: "Made your PDF!",
          sentence: `${pluralPages(imageItems.length)} fitted onto ${pluralPages(imageItems.length)}, ${formatBytes(out.blob.size)}.`,
          beforeAfter: { count: imageItems.length },
          outputs: [{ blob: out.blob, name: "pictures.pdf" }],
          at: Date.now(),
        });
      } else if (tab === "text-to-pdf" && (text.trim() || textItem)) {
        const body = text.trim() || (textItem ? await textItem.file.text() : "");
        const out = await runTextToPdf(
          { text: body, title: textItem?.name?.replace(/\.txt$/i, "") },
          { onProgress: (p, label) => { setProgress(p); if (label) setProgressLabel(label); } },
        );
        sound.stopLoop("chew");
        sound.play("success");
        haptic("success");
        setResult({
          id: `txt2pdf-${Date.now()}`,
          tool: "text-to-pdf",
          headline: "Made your PDF!",
          sentence: `Typed text became ${pluralPages(out.pages)} of A4.`,
          beforeAfter: { pages: out.pages },
          outputs: [{ blob: out.blob, name: "document.pdf" }],
          at: Date.now(),
        });
      }
      clearAll();
      router.push("/done");
      setBusy(false);
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
      toast.error("Something went wrong while converting. Try again.");
    }
  };

  const paneReady =
    !busy &&
    ((tab === "pdf-to-image" && pdfItem) ||
      (tab === "image-to-pdf" && imageItems.length > 0) ||
      (tab === "text-to-pdf" && (text.trim().length > 0 || !!textItem)));

  const nPages =
    tab === "pdf-to-image" && pdfPages != null ? pdfPages : tab === "image-to-pdf" ? imageItems.length : null;

  const runLabel =
    tab === "pdf-to-image"
      ? nPages != null
        ? `Convert ${pluralPages(nPages)}`
        : "Convert"
      : tab === "image-to-pdf"
        ? "Make the PDF"
        : "Make the PDF";

  return (
    <section aria-label="Convert tool" className="mt-8 flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Convert tab">
        {TABS.map((t) => (
          <Chip key={t.key} label={t.label} selected={tab === t.key} onClick={() => setTab(t.key)} />
        ))}
      </div>

      {busy ? (
        <div className="rounded-card-l bg-surface p-6 text-center" role="status" aria-live="polite">
          <Pip mood="chewing" size={120} className="mx-auto" />
          <p className="mt-3 text-body text-muted">
            {progressLabel || "Chewing…"} {Math.round(progress * 100)}%
          </p>
        </div>
      ) : tab === "pdf-to-image" ? (
        <>
          {pdfItem ? (
            <>
              <motion.div
                key={pdfItem.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-phone-chip bg-amber px-3.5 py-3 text-ink"
              >
                <span className="min-w-0 flex-1 truncate font-bold text-[15px]">{pdfItem.name}</span>
                <span className="tnum mr-1 shrink-0 text-[12px]">
                  {pdfPages != null ? pluralPages(pdfPages) : "counting…"} · {formatBytes(pdfItem.size)}
                </span>
                <button
                  type="button"
                  aria-label="Remove file"
                  className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[22px] bg-ink/10 text-ink"
                  onClick={() => {
                    remove("convert", pdfItem.id);
                    sound.play("pop");
                  }}
                >
                  <IconClose width={16} height={16} />
                </button>
              </motion.div>
              <h2 className="font-display text-h2 font-extrabold">Save as</h2>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((f) => (
                  <Chip key={f.key} label={f.label} selected={format === f.key} onClick={() => setFormat(f.key)} />
                ))}
              </div>
              <p className="text-small text-muted">
                High quality on this device. More than one page comes back as a zip.
              </p>
            </>
          ) : (
            <DropZone accept={["pdf"]} label="Add file" hint="Drop your PDF here. Nothing is uploaded." onFiles={ingest} />
          )}
          {/* The locked extra, as the screen says it */}
          <p className="flex flex-wrap items-center gap-2 text-small text-muted">
            <span className="rounded-pill border-2 border-line py-1 px-3 text-[12px] font-bold text-dim opacity-70" aria-disabled="true">
              Word
            </span>
            <span>Soon — Word and PowerPoint need a server, so they will arrive as a Pro extra.</span>
          </p>
        </>
      ) : tab === "image-to-pdf" ? (
        <>
          {imageItems.length > 0 ? (
            <div className="flex flex-col gap-2">
              {imageItems.map((im) => (
                <motion.div
                  key={im.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-phone-chip bg-surface px-3.5 py-2.5"
                >
                  <span className="min-w-0 flex-1 truncate font-bold text-[14px]">{im.name}</span>
                  <span className="tnum mr-1 shrink-0 text-[12px] text-muted">{formatBytes(im.size)}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${im.name}`}
                    className="ml-2 flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[22px] bg-line/60"
                    onClick={() => {
                      remove("convert", im.id);
                      sound.play("pop");
                    }}
                  >
                    <IconClose width={14} height={14} />
                  </button>
                </motion.div>
              ))}
              <p className="text-small text-muted">
                {pluralPages(imageItems.length)} will become one PDF, each image a fitted page.
              </p>
            </div>
          ) : (
            <DropZone accept={["image"]} label="Add image" hint="Drop a JPG, PNG or WebP. Nothing is uploaded." onFiles={ingest} />
          )}
        </>
      ) : (
        <>
          <label htmlFor="convert-text" className="sr-only">
            Text to put into the PDF
          </label>
          <textarea
            id="convert-text"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type here. What you type becomes a clean A4 PDF."
            className="w-full rounded-card-l border-2 border-line bg-surface px-4 py-3.5 font-bold text-cream outline-none focus:border-amber"
          />
          {textItem ? (
            <p className="text-small text-muted">A text file ({textItem.name}) is waiting too — press the button to use it.</p>
          ) : null}
        </>
      )}

      <div className="sticky bottom-28 z-10 md:bottom-8">
        <Button disabled={!paneReady} className="w-full" size="lg" onClick={() => void run()} aria-busy={busy}>
          {busy ? `Converting… ${Math.round(progress * 100)}%` : runLabel}
        </Button>
      </div>
    </section>
  );
}
