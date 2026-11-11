"use client";

/**
 * PDF → text / Markdown. Text is read from the PDF's own text layer, laid out
 * by position so columns and lines stay readable. Scans have no text layer;
 * the tool says so instead of returning an empty file.
 */
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DropZone } from "@/components/ui/DropZone";
import { Button, Chip } from "@/components/ui/core";
import { BusyCard, FileHead, StickyAction, ToolCard, ToolNote } from "@/components/tools/ToolParts";
import { useToolFiles } from "@/lib/store/docs";
import { useDoneStore } from "@/lib/store/done";
import { runPdfText, readPageCount, CancelledError } from "@/lib/engine/client";
import type { PdfTextFormat } from "@/lib/engine/types";
import { fileErrors, type FileItem } from "@/lib/files";
import { formatBytes, pluralPages } from "@/lib/format";
import { parseRanges } from "@/lib/ranges";
import { calmError } from "@/lib/errors";
import { toast } from "@/lib/store/toasts";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

type Scope = "all" | "range";

export function PdfTextTool() {
  const router = useRouter();
  const files = useToolFiles((s) => s.files.text);
  const add = useToolFiles((s) => s.add);
  const clear = useToolFiles((s) => s.clear);
  const setResult = useDoneStore((s) => s.setResult);

  const [format, setFormat] = useState<PdfTextFormat>("text");
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
    clear("text");
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
      add("text", [{ ...first, pageCount: info.pageCount }]);
      sound.play("gulp");
      haptic("success");
    } catch {
      toast.error(fileErrors.unopenable);
    }
  };

  const run = async () => {
    if (!item) return;
    const pages = scope === "range" ? (parsed?.pages ?? []) : "all";
    if (scope === "range" && (!parsed?.ok || pages.length === 0)) {
      toast.error("Choose a valid page range, like 1-3, 5.");
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setProgress(0);
    setLabel("Reading");
    sound.startLoop("chew");
    haptic("tap");
    try {
      const out = await runPdfText(
        { file: item.file, pages, format },
        {
          signal: controller.signal,
          onProgress: (p, l) => {
            setProgress(p);
            if (l) setLabel(l);
          },
        },
      );
      if (out.chars === 0) {
        sound.stopLoop("chew");
        sound.play("error");
        haptic("error");
        toast.error("No selectable text found. This looks like a scan; use the OCR tool to read it.");
        return;
      }
      sound.stopLoop("chew");
      sound.play("success");
      haptic("success");
      const stem = item.name.replace(/\.pdf$/i, "");
      const ext = format === "markdown" ? "md" : "txt";
      setResult({
        id: `text-${Date.now()}`,
        tool: format === "markdown" ? "pdf-to-markdown" : "pdf-to-text",
        headline: format === "markdown" ? "Markdown out!" : "Text out!",
        sentence: `${item.name}: ${out.pages} ${out.pages === 1 ? "page" : "pages"}, ${out.chars.toLocaleString()} characters, as ${
          format === "markdown" ? "Markdown" : "plain text"
        }.`,
        beforeAfter: { before: item.size, after: out.blob.size, pages: out.pages },
        outputs: [{ blob: out.blob, name: `${stem}.${ext}` }],
        at: Date.now(),
      });
      clear("text");
      router.push("/done");
    } catch (e) {
      sound.stopLoop("chew");
      sound.play("error");
      haptic("error");
      if (e instanceof CancelledError) return;
      toast.error(calmError(e, "Could not read text from this PDF. Try another file."));
    } finally {
      setBusy(false);
      controllerRef.current = null;
    }
  };

  const canRun = !!item && !busy && (scope === "all" || (parsed?.ok === true && parsed.pages.length > 0));

  return (
    <section aria-label="PDF to text" className="mt-8 flex flex-col gap-4">
      {!item ? (
        <DropZone
          accept={["pdf"]}
          label="Add a PDF"
          hint="Turn the text layer into a .txt or .md file. Nothing is uploaded."
          onFiles={(i) => void addFile(i)}
        />
      ) : (
        <>
          <FileHead
            name={item.name}
            meta={`${pageCount ? pluralPages(pageCount) : "PDF"} · ${formatBytes(item.size)}`}
            onRemove={() => clear("text")}
          />

          <ToolCard>
            <h2 className="font-display text-h3 font-extrabold">Format</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip label="Plain text" selected={format === "text"} onClick={() => setFormat("text")} />
              <Chip label="Markdown" selected={format === "markdown"} onClick={() => setFormat("markdown")} />
            </div>
            <p className="mt-2 text-small text-muted">
              {format === "text"
                ? "Line breaks follow the page. Good for notes, search and copy-paste."
                : "Headings come from larger text; bullets stay bullets. Good for docs and wikis."}
            </p>

            <h2 className="mt-5 font-display text-h3 font-extrabold">Pages</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip label="All pages" selected={scope === "all"} onClick={() => setScope("all")} />
              <Chip label="Choose a range" selected={scope === "range"} onClick={() => setScope("range")} />
            </div>
            {scope === "range" ? (
              <div className="mt-3">
                <label htmlFor="text-range" className="text-[12px] font-bold text-cream">
                  Pages to read
                </label>
                <input
                  id="text-range"
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  placeholder={pageCount ? `1-${pageCount}` : "1-3, 5"}
                  inputMode="numeric"
                  aria-invalid={!!rangeError}
                  aria-describedby={rangeError ? "text-range-error" : undefined}
                  className="mt-1 min-h-[44px] w-full rounded-card border-2 border-line bg-cream px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-amber"
                />
                {rangeError ? (
                  <p id="text-range-error" className="mt-1 text-small text-peach">
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
              Text is read on this device. If the page is a picture of words, there is nothing to extract; the OCR tool
              can read it instead.
            </ToolNote>
          </ToolCard>

          {busy ? (
            <BusyCard progress={progress} label={label || "Reading…"} onCancel={() => controllerRef.current?.abort()} />
          ) : null}

          <StickyAction>
            <Button disabled={!canRun} className="w-full" size="lg" onClick={() => void run()} aria-busy={busy}>
              {busy ? `Reading… ${Math.round(progress * 100)}%` : `Extract ${format === "markdown" ? "Markdown" : "text"}`}
            </Button>
          </StickyAction>
        </>
      )}
    </section>
  );
}
