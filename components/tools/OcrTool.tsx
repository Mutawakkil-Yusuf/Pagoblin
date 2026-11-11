"use client";

/**
 * Local OCR: tesseract.js reads rendered pages and builds a searchable PDF
 * (page image plus invisible selectable text) or a plain text file. Language
 * packs and engine files are served by this app, never a CDN.
 */
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DropZone } from "@/components/ui/DropZone";
import { Button, Chip } from "@/components/ui/core";
import { BusyCard, FileHead, StickyAction, ToolCard, ToolNote } from "@/components/tools/ToolParts";
import { useToolFiles } from "@/lib/store/docs";
import { useDoneStore } from "@/lib/store/done";
import { readPageCount, CancelledError } from "@/lib/engine/client";
import { ocrPdf, OCR_LANGS, type OcrLang, type OcrOutputMode } from "@/lib/engine/ocr";
import { fileErrors, type FileItem } from "@/lib/files";
import { formatBytes, pluralPages } from "@/lib/format";
import { parseRanges } from "@/lib/ranges";
import { calmError } from "@/lib/errors";
import { toast } from "@/lib/store/toasts";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

type Scope = "all" | "range";

export function OcrTool() {
  const router = useRouter();
  const files = useToolFiles((s) => s.files.ocr);
  const add = useToolFiles((s) => s.add);
  const clear = useToolFiles((s) => s.clear);
  const setResult = useDoneStore((s) => s.setResult);

  const [lang, setLang] = useState<OcrLang>("eng");
  const [mode, setMode] = useState<OcrOutputMode>("pdf");
  const [scope, setScope] = useState<Scope>("all");
  const [range, setRange] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  const item: FileItem | undefined = files[0];
  const pageCount = item?.pageCount ?? 0;
  const parsed = useMemo(() => (scope === "range" ? parseRanges(range, pageCount) : null), [scope, range, pageCount]);
  const rangeError = parsed && range.length > 0 && !parsed.ok ? parsed.tokens.find((t) => t.type === "error") : null;

  const addFile = async (incoming: FileItem[]) => {
    clear("ocr");
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
      add("ocr", [{ ...first, pageCount: info.pageCount }]);
      sound.play("gulp");
      haptic("success");
    } catch {
      toast.error(fileErrors.unopenable);
    }
  };

  const run = async () => {
    if (!item) return;
    const pages = scope === "range" ? (parsed?.pages ?? []) : Array.from({ length: pageCount }, (_, i) => i + 1);
    if (!pages.length) {
      toast.error("Choose a valid page range, like 1-3, 5.");
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setProgress(0);
    setLabel("Starting the OCR engine");
    sound.startLoop("chew");
    haptic("tap");
    try {
      const out = await ocrPdf({
        file: item.file,
        pages,
        lang,
        mode,
        signal: controller.signal,
        onProgress: (p, l) => {
          setProgress(p);
          if (l) setLabel(l);
        },
      });
      if (out.chars === 0) {
        sound.stopLoop("chew");
        sound.play("error");
        haptic("error");
        toast.error("No readable words found. Try a clearer scan, or pick the language the document is in.");
        return;
      }
      sound.stopLoop("chew");
      sound.play("success");
      haptic("success");
      const stem = item.name.replace(/\.pdf$/i, "");
      const langLabel = OCR_LANGS.find((l) => l.key === lang)?.label ?? lang;
      setResult({
        id: `ocr-${Date.now()}`,
        tool: "ocr",
        headline: "Read!",
        sentence:
          mode === "pdf"
            ? `${item.name}: ${out.pages} ${out.pages === 1 ? "page" : "pages"} read in ${langLabel}, ${out.words.toLocaleString()} words placed as invisible text over the page images. You can search and select the result.`
            : `${item.name}: ${out.pages} ${out.pages === 1 ? "page" : "pages"} read in ${langLabel}, ${out.chars.toLocaleString()} characters.`,
        beforeAfter: { before: item.size, after: out.blob.size, pages: out.pages },
        outputs: [
          {
            blob: out.blob,
            name: mode === "pdf" ? `${stem}-searchable.pdf` : `${stem}-ocr.txt`,
          },
        ],
        at: Date.now(),
      });
      clear("ocr");
      router.push("/done");
    } catch (e) {
      sound.stopLoop("chew");
      sound.play("error");
      haptic("error");
      if (e instanceof CancelledError || controller.signal.aborted) return;
      toast.error(calmError(e, "OCR could not finish this PDF. Try fewer pages or a clearer scan."));
    } finally {
      setBusy(false);
      controllerRef.current = null;
    }
  };

  const canRun = !!item && !busy && (scope === "all" || (parsed?.ok === true && parsed.pages.length > 0));

  return (
    <section aria-label="OCR a PDF" className="mt-8 flex flex-col gap-4">
      {!item ? (
        <DropZone
          accept={["pdf"]}
          label="Add a scan"
          hint="Turn pictures of words into searchable text. The engine loads from this app, not a server."
          onFiles={(i) => void addFile(i)}
        />
      ) : (
        <>
          <FileHead
            name={item.name}
            meta={`${pageCount ? pluralPages(pageCount) : "PDF"} · ${formatBytes(item.size)}`}
            onRemove={() => clear("ocr")}
          />

          <ToolCard>
            <h2 className="font-display text-h3 font-extrabold">Language in the document</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {OCR_LANGS.map((l) => (
                <Chip key={l.key} label={l.label} selected={lang === l.key} onClick={() => setLang(l.key)} />
              ))}
            </div>
            <p className="mt-2 text-small text-muted">
              Only the chosen language pack is loaded, then kept on this device for next time.
            </p>

            <h2 className="mt-5 font-display text-h3 font-extrabold">Output</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip label="Searchable PDF" selected={mode === "pdf"} onClick={() => setMode("pdf")} />
              <Chip label="Plain text" selected={mode === "text"} onClick={() => setMode("text")} />
            </div>
            <p className="mt-2 text-small text-muted">
              {mode === "pdf"
                ? "The page image stays exactly as scanned, with invisible text on top so search and copy work."
                : "Just the words, in reading order, as a .txt file."}
            </p>

            <h2 className="mt-5 font-display text-h3 font-extrabold">Pages</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip label="All pages" selected={scope === "all"} onClick={() => setScope("all")} />
              <Chip label="Choose a range" selected={scope === "range"} onClick={() => setScope("range")} />
            </div>
            {scope === "range" ? (
              <div className="mt-3">
                <label htmlFor="ocr-range" className="text-[12px] font-bold text-cream">
                  Pages to read
                </label>
                <input
                  id="ocr-range"
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  placeholder={pageCount ? `1-${pageCount}` : "1-3, 5"}
                  inputMode="numeric"
                  aria-invalid={!!rangeError}
                  aria-describedby={rangeError ? "ocr-range-error" : undefined}
                  className="mt-1 min-h-[44px] w-full rounded-card border-2 border-line bg-cream px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-amber"
                />
                {rangeError ? (
                  <p id="ocr-range-error" className="mt-1 text-small text-peach">
                    {rangeError.type === "error" ? rangeError.message : ""}
                  </p>
                ) : (
                  <p className="mt-1 text-small text-muted">
                    {parsed?.ok ? `${parsed.pages.length} of ${pageCount} pages selected.` : "Example: 1-3, 5, 8-"}
                  </p>
                )}
              </div>
            ) : null}

            <ToolNote className="mt-4">
              OCR runs on this device. The first run loads the engine (a few megabytes) from this app; it is cached for
              offline use. Your PDF is never uploaded.
            </ToolNote>
          </ToolCard>

          {busy ? (
            <BusyCard progress={progress} label={label || "Reading…"} onCancel={() => controllerRef.current?.abort()} />
          ) : null}

          <StickyAction>
            <Button disabled={!canRun} className="w-full" size="lg" onClick={() => void run()} aria-busy={busy}>
              {busy
                ? `Reading… ${Math.round(progress * 100)}%`
                : mode === "pdf"
                  ? "Make searchable PDF"
                  : "Extract text"}
            </Button>
          </StickyAction>
        </>
      )}
    </section>
  );
}
