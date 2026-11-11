"use client";

/**
 * Local sanitizer report. Shows metadata, scripts, attachments, form layers,
 * annotations and the fonts each page references, then rebuilds a clean copy
 * with one tap. The report and the clean copy both stay on the device.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DropZone } from "@/components/ui/DropZone";
import { Button } from "@/components/ui/core";
import { BusyCard, FileHead, StickyAction, ToolCard, ToolNote } from "@/components/tools/ToolParts";
import { useToolFiles } from "@/lib/store/docs";
import { useDoneStore } from "@/lib/store/done";
import { runSanitizeInspect, runSanitize, readPageCount, CancelledError } from "@/lib/engine/client";
import type { PdfInspectOutput, PdfMetadataFields, PdfRiskReport, PdfSignatureInfo } from "@/lib/engine/types";
import { fileErrors, type FileItem } from "@/lib/files";
import { formatBytes, pluralPages } from "@/lib/format";
import { calmError } from "@/lib/errors";
import { toast } from "@/lib/store/toasts";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

const RISK_ROWS: { key: keyof PdfRiskReport; label: string; hint: string }[] = [
  { key: "javascript", label: "JavaScript", hint: "Code embedded in the PDF" },
  { key: "embeddedFiles", label: "Embedded files", hint: "Attachments travelling with the PDF" },
  { key: "openAction", label: "Open action", hint: "Something that runs when the file opens" },
  { key: "launch", label: "Launch action", hint: "Can ask the viewer to open another file" },
  { key: "uri", label: "Links", hint: "Web addresses in annotations" },
  { key: "annotations", label: "Annotations", hint: "Comments, forms and marks" },
  { key: "xmp", label: "XMP metadata", hint: "A second metadata block" },
  { key: "acroForm", label: "Form", hint: "AcroForm fields" },
  { key: "xfa", label: "XFA form", hint: "An older XML form layer" },
];

const META_ROWS: { key: keyof PdfMetadataFields; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "author", label: "Author" },
  { key: "creator", label: "Creator app" },
  { key: "producer", label: "Producer" },
];

function formatDate(value: string): string {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function signalCount(risks: PdfRiskReport): number {
  return Object.values(risks).reduce<number>((n, value) => n + (typeof value === "number" ? value : value ? 1 : 0), 0);
}

function signatureStatus(signature: PdfSignatureInfo): string {
  if (!signature.signed) return "Empty signature field";
  if (signature.coversWholeFile) return "Covers the whole file";
  if (signature.modifiedAfterSigning) return "File changed after signing";
  return "Byte range does not match this file";
}

export function SanitizeTool() {
  const router = useRouter();
  const files = useToolFiles((s) => s.files.sanitize);
  const add = useToolFiles((s) => s.add);
  const clear = useToolFiles((s) => s.clear);
  const setResult = useDoneStore((s) => s.setResult);

  const [info, setInfo] = useState<PdfInspectOutput | null>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  const item: FileItem | undefined = files[0];

  useEffect(() => {
    if (!item) {
      setInfo(null);
      return;
    }
    let alive = true;
    setInfo(null);
    setReading(true);
    void (async () => {
      try {
        const count = await readPageCount(item.file);
        if (count.encrypted) {
          toast.error(fileErrors.password);
          clear("sanitize");
          return;
        }
        const out = await runSanitizeInspect({ file: item.file });
        if (!alive) return;
        setInfo(out);
        sound.play("pop");
      } catch (e) {
        if (!alive) return;
        toast.error(calmError(e, fileErrors.unopenable));
        clear("sanitize");
      } finally {
        if (alive) setReading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const clean = async () => {
    if (!item) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setProgress(0);
    setLabel("Cleaning");
    sound.startLoop("chew");
    haptic("tap");
    try {
      const out = await runSanitize(
        { file: item.file },
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
      const totalRemoved = signalCount(out.removed);
      const afterSignals = signalCount(out.afterRisks);
      const stem = item.name.replace(/\.pdf$/i, "");
      setResult({
        id: `sanitize-${Date.now()}`,
        tool: "sanitize",
        headline: "Cleaned!",
        sentence: `${item.name}: a fresh copy with ${totalRemoved} metadata and action ${
          totalRemoved === 1 ? "signal" : "signals"
        } removed. A second scan of the clean copy found ${
          afterSignals ? `${afterSignals} residual ${afterSignals === 1 ? "signal" : "signals"}` : "no metadata or action signals"
        }. The visible pages are unchanged.`,
        beforeAfter: { before: out.before, after: out.after, pages: info?.pageCount },
        outputs: [{ blob: out.blob, name: `${stem}-clean.pdf` }],
        at: Date.now(),
      });
      clear("sanitize");
      router.push("/done");
    } catch (e) {
      sound.stopLoop("chew");
      sound.play("error");
      haptic("error");
      if (e instanceof CancelledError) return;
      toast.error(calmError(e, "Could not clean this PDF. Try again."));
    } finally {
      setBusy(false);
      controllerRef.current = null;
    }
  };

  const emptySignatures = info?.signatures.filter((signature) => !signature.signed) ?? [];
  const totalSignals = info ? signalCount(info.risks) : 0;

  return (
    <section aria-label="PDF sanitizer" className="mt-8 flex flex-col gap-4">
      {!item ? (
        <DropZone
          accept={["pdf"]}
          label="Add a PDF"
          hint="See metadata, scripts, attachments and fonts, then clean a copy."
          onFiles={(incoming) => {
            clear("sanitize");
            add("sanitize", incoming.slice(0, 1));
          }}
        />
      ) : (
        <>
          <FileHead
            name={item.name}
            meta={`${info ? pluralPages(info.pageCount) : reading ? "reading…" : "PDF"} · ${formatBytes(item.size)}`}
            onRemove={() => clear("sanitize")}
          />

          {reading || !info ? (
            <BusyCard progress={0.4} label="Reading metadata, fonts and attachments…" />
          ) : (
            <>
              <ToolCard>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-h3 font-extrabold">Sanitizer report</h2>
                  <span
                    className={`rounded-pill px-2.5 py-1 text-[11px] font-bold ${
                      totalSignals ? "bg-orange text-ink" : "bg-amber text-ink"
                    }`}
                  >
                    {totalSignals ? `${totalSignals} signals` : "Nothing loud"}
                  </span>
                </div>
                <p className="mt-1 text-small text-muted">
                  A structural read of the file. Counts are signals, not a virus scan.
                </p>
                <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {RISK_ROWS.map((row) => {
                    const value = info.risks[row.key];
                    const present = typeof value === "boolean" ? value : value > 0;
                    return (
                      <li
                        key={row.key}
                        className={`rounded-phone-chip px-3 py-2 ${present ? "bg-amber/15" : "bg-ink/40"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-bold text-cream">{row.label}</span>
                          <span
                            className={`tnum rounded-pill px-2 py-0.5 text-[11px] font-bold ${
                              present ? "bg-amber text-ink" : "bg-line/60 text-muted"
                            }`}
                          >
                            {typeof value === "boolean" ? (value ? "yes" : "no") : value}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] leading-4 text-muted">{row.hint}</p>
                      </li>
                    );
                  })}
                </ul>
              </ToolCard>

              <div className="grid gap-4 lg:grid-cols-2">
                <ToolCard>
                  <h2 className="font-display text-h3 font-extrabold">Metadata</h2>
                  <p className="mt-1 text-small text-muted">What the file says about its author and history.</p>
                  <dl className="mt-3 flex flex-col gap-2">
                    {META_ROWS.map((row) => (
                      <div key={row.key} className="rounded-phone-chip bg-ink/50 px-3 py-2">
                        <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">{row.label}</dt>
                        <dd className={`mt-0.5 break-words text-[14px] ${info.metadata[row.key] ? "text-cream" : "text-dim"}`}>
                          {info.metadata[row.key] || "Not set"}
                        </dd>
                      </div>
                    ))}
                    <div className="rounded-phone-chip bg-ink/50 px-3 py-2">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">Created</dt>
                      <dd className="mt-0.5 text-[14px] text-cream">{formatDate(info.metadata.creationDate)}</dd>
                    </div>
                    <div className="rounded-phone-chip bg-ink/50 px-3 py-2">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">Modified</dt>
                      <dd className="mt-0.5 text-[14px] text-cream">{formatDate(info.metadata.modificationDate)}</dd>
                    </div>
                  </dl>
                </ToolCard>

                <ToolCard>
                  <h2 className="font-display text-h3 font-extrabold">Fonts</h2>
                  <p className="mt-1 text-small text-muted">
                    Fonts referenced by page resources. Embedded fonts travel with the file; referenced fonts rely on
                    the reader having them.
                  </p>
                  {info.fonts.length ? (
                    <ul className="mt-3 flex flex-col gap-2">
                      {info.fonts.map((font) => (
                        <li key={`${font.name}-${font.type}-${font.embedded}`} className="rounded-phone-chip bg-ink/50 px-3 py-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="min-w-0 break-words text-[13px] font-bold text-cream">{font.name}</span>
                            <span
                              className={`shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-bold ${
                                font.embedded ? "bg-amber text-ink" : "bg-orange text-ink"
                              }`}
                            >
                              {font.embedded ? "embedded" : "not embedded"}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted">
                            {font.type}
                            {font.subset ? " · subset" : ""} · {font.pages} {font.pages === 1 ? "page" : "pages"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-small text-muted">
                      No font dictionaries found in page resources. The pages may be scans or vector-only.
                    </p>
                  )}
                </ToolCard>
              </div>

              {info.embeddedFiles.length ? (
                <ToolCard>
                  <h2 className="font-display text-h3 font-extrabold">Embedded files</h2>
                  <p className="mt-1 text-small text-muted">Attachments are not part of the visible pages.</p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {info.embeddedFiles.map((name) => (
                      <li key={name} className="rounded-phone-chip bg-orange/15 px-3 py-2 text-[13px] font-bold text-cream">
                        {name}
                      </li>
                    ))}
                  </ul>
                </ToolCard>
              ) : null}

              {info.signatures.some((signature) => signature.signed) ? (
                <div className="rounded-card-l border border-orange/60 bg-orange/10 p-5">
                  <h2 className="font-display text-h3 font-extrabold text-cream">Signatures</h2>
                  <p className="mt-1 text-small text-muted">
                    Cleaning rebuilds the document, so a digital signature will not survive the clean copy.
                  </p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {info.signatures
                      .filter((signature) => signature.signed)
                      .map((signature, index) => (
                        <li key={`${signature.field}-${index}`} className="rounded-phone-chip bg-ink/50 px-3 py-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[13px] font-bold text-cream">{signature.field}</span>
                            <span className="rounded-pill bg-orange px-2 py-0.5 text-[10px] font-bold text-ink">
                              {signatureStatus(signature)}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] leading-4 text-muted">
                            {signature.kind === "certification" ? "Certification signature" : "Signature"}
                            {signature.subFilter ? ` · ${signature.subFilter}` : ""}
                            {signature.signedAt ? ` · ${signature.signedAt}` : ""}
                          </p>
                        </li>
                      ))}
                  </ul>
                </div>
              ) : info.signatures.length ? null : (
                <ToolNote>No digital signature fields found.</ToolNote>
              )}

              {emptySignatures.length ? (
                <ToolNote>
                  {emptySignatures.length} empty signature {emptySignatures.length === 1 ? "field" : "fields"} found.
                  Cleaning removes the field.
                </ToolNote>
              ) : null}

              <ToolNote>
                Cleaning rebuilds the PDF from its pages and removes metadata, document actions, JavaScript, attachments,
                forms, outlines, XMP and page annotations. Visible content stays the same. Fonts the visible text needs
                stay with the pages.
              </ToolNote>

              {busy ? (
                <BusyCard progress={progress} label={label || "Cleaning…"} onCancel={() => controllerRef.current?.abort()} />
              ) : null}

              <StickyAction>
                <Button className="w-full" size="lg" disabled={busy} onClick={() => void clean()} aria-busy={busy}>
                  {busy ? `Cleaning… ${Math.round(progress * 100)}%` : "Clean a copy"}
                </Button>
              </StickyAction>
            </>
          )}
        </>
      )}
    </section>
  );
}
