"use client";

/**
 * Metadata inspector / editor / sanitizer. Shows what the file says about its
 * author and history, lets you rewrite it, and can rebuild a clean copy that
 * drops document actions, attachments, forms and XMP data.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { DropZone } from "@/components/ui/DropZone";
import { Button } from "@/components/ui/core";
import { BusyCard, FileHead, StickyAction, ToolCard, ToolNote } from "@/components/tools/ToolParts";
import { useToolFiles } from "@/lib/store/docs";
import { useDoneStore } from "@/lib/store/done";
import {
  runMetadataRead,
  runMetadataWrite,
  runSanitize,
  readPageCount,
  CancelledError,
} from "@/lib/engine/client";
import type { PdfMetadataFields, PdfMetadataOutput, PdfRiskReport } from "@/lib/engine/types";
import { fileErrors, type FileItem } from "@/lib/files";
import { formatBytes, pluralPages } from "@/lib/format";
import { calmError } from "@/lib/errors";
import { toast } from "@/lib/store/toasts";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

const EMPTY: PdfMetadataFields = {
  title: "",
  author: "",
  subject: "",
  keywords: "",
  creator: "",
  producer: "",
  creationDate: "",
  modificationDate: "",
};

const FIELD_LABELS: { key: keyof PdfMetadataFields; label: string; placeholder: string }[] = [
  { key: "title", label: "Title", placeholder: "What the document is called" },
  { key: "author", label: "Author", placeholder: "A person or team" },
  { key: "subject", label: "Subject", placeholder: "One line about the contents" },
  { key: "keywords", label: "Keywords", placeholder: "invoice, 2026, client" },
  { key: "creator", label: "Creator app", placeholder: "The app that made it" },
  { key: "producer", label: "Producer", placeholder: "The PDF engine" },
];

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

function riskCount(risks: PdfRiskReport, key: keyof PdfRiskReport): number | boolean {
  return risks[key];
}

function formatDate(value: string): string {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function MetadataTool() {
  const router = useRouter();
  const files = useToolFiles((s) => s.files.metadata);
  const add = useToolFiles((s) => s.add);
  const clear = useToolFiles((s) => s.clear);
  const setResult = useDoneStore((s) => s.setResult);

  const [info, setInfo] = useState<PdfMetadataOutput | null>(null);
  const [fields, setFields] = useState<PdfMetadataFields>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  const item: FileItem | undefined = files[0];

  useEffect(() => {
    if (!item) {
      setInfo(null);
      setFields(EMPTY);
      return;
    }
    let alive = true;
    setReading(true);
    void (async () => {
      try {
        const count = await readPageCount(item.file);
        if (count.encrypted) {
          toast.error(fileErrors.password);
          clear("metadata");
          return;
        }
        const out = await runMetadataRead({ file: item.file });
        if (!alive) return;
        setInfo(out);
        setFields(out.metadata);
        sound.play("pop");
      } catch (e) {
        if (!alive) return;
        toast.error(calmError(e, fileErrors.unopenable));
        clear("metadata");
      } finally {
        if (alive) setReading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const setField = (key: keyof PdfMetadataFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const changed = info
    ? (Object.keys(EMPTY) as (keyof PdfMetadataFields)[]).some((key) => fields[key] !== info.metadata[key])
    : false;

  const save = async (action: "write" | "sanitize") => {
    if (!item) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setProgress(0);
    setLabel(action === "sanitize" ? "Cleaning" : "Saving");
    sound.startLoop("chew");
    haptic("tap");
    try {
      const stem = item.name.replace(/\.pdf$/i, "");
      if (action === "write") {
        const out = await runMetadataWrite(
          { file: item.file, metadata: fields },
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
        setResult({
          id: `metadata-${Date.now()}`,
          tool: "metadata",
          headline: "Metadata saved!",
          sentence: `${item.name}: the document properties now say what you chose. The pages are unchanged.`,
          beforeAfter: { before: item.size, after: out.blob.size, pages: item.pageCount },
          outputs: [{ blob: out.blob, name: `${stem}-metadata.pdf` }],
          at: Date.now(),
        });
      } else {
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
        const totalRemoved = Object.values(out.removed).reduce<number>(
          (n, v) => n + (typeof v === "number" ? v : v ? 1 : 0),
          0,
        );
        setResult({
          id: `sanitize-${Date.now()}`,
          tool: "sanitize",
          headline: "Cleaned!",
          sentence: `${item.name}: a fresh copy with ${totalRemoved} metadata and action ${
            totalRemoved === 1 ? "signal" : "signals"
          } removed. The visible pages are unchanged.`,
          beforeAfter: { before: out.before, after: out.after, pages: item.pageCount },
          outputs: [{ blob: out.blob, name: `${stem}-clean.pdf` }],
          at: Date.now(),
        });
      }
      clear("metadata");
      router.push("/done");
    } catch (e) {
      sound.stopLoop("chew");
      sound.play("error");
      haptic("error");
      if (e instanceof CancelledError) return;
      toast.error(calmError(e, "Could not save the metadata. Try again."));
    } finally {
      setBusy(false);
      controllerRef.current = null;
    }
  };

  return (
    <section aria-label="PDF metadata" className="mt-8 flex flex-col gap-4">
      {!item ? (
        <DropZone
          accept={["pdf"]}
          label="Add a PDF"
          hint="See what the file says about you, change it, or make a clean copy."
          onFiles={(i) => {
            clear("metadata");
            add("metadata", i.slice(0, 1));
          }}
        />
      ) : (
        <>
          <FileHead
            name={item.name}
            meta={`${info ? pluralPages(info.pageCount) : reading ? "reading…" : "PDF"} · ${formatBytes(item.size)}`}
            onRemove={() => clear("metadata")}
          />

          {reading || !info ? (
            <BusyCard progress={0.4} label="Reading the document properties…" />
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <ToolCard>
                  <h2 className="font-display text-h3 font-extrabold">Before</h2>
                  <p className="mt-1 text-small text-muted">What this file says right now.</p>
                  <dl className="mt-3 flex flex-col gap-2">
                    {FIELD_LABELS.map((f) => (
                      <div key={f.key} className="rounded-phone-chip bg-ink/50 px-3 py-2">
                        <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">{f.label}</dt>
                        <dd className={`mt-0.5 break-words text-[14px] ${info.metadata[f.key] ? "text-cream" : "text-dim"}`}>
                          {info.metadata[f.key] || "Not set"}
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
                  <h2 className="font-display text-h3 font-extrabold">After</h2>
                  <p className="mt-1 text-small text-muted">Edit a field to change what the copy says.</p>
                  <div className="mt-3 flex flex-col gap-3">
                    {FIELD_LABELS.map((f) => (
                      <label key={f.key} className="flex flex-col gap-1 text-[12px] font-bold text-cream">
                        {f.label}
                        <input
                          value={fields[f.key]}
                          onChange={(e) => setField(f.key, e.target.value)}
                          placeholder={f.placeholder}
                          className="min-h-[44px] w-full rounded-card border-2 border-line bg-cream px-3.5 py-2.5 text-[14px] font-normal text-ink outline-none focus:border-amber"
                        />
                      </label>
                    ))}
                  </div>
                </ToolCard>
              </div>

              <ToolCard>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-h3 font-extrabold">What is inside</h2>
                  <span className="text-small text-muted">{formatBytes(info.size)}</span>
                </div>
                <p className="mt-1 text-small text-muted">
                  A quick structural scan. Counts are signals, not a virus scan.
                </p>
                <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {RISK_ROWS.map((row) => {
                    const value = riskCount(info.risks, row.key);
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
                <ToolNote className="mt-4">
                  Cleaning rebuilds the PDF from its pages and removes metadata, document actions, attachments, forms,
                  outlines and page annotations. Visible content stays the same. If the file is signed, the signature
                  will not survive a clean copy.
                </ToolNote>
              </ToolCard>

              {busy ? (
                <BusyCard progress={progress} label={label || "Working…"} onCancel={() => controllerRef.current?.abort()} />
              ) : null}

              <StickyAction>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={busy || !changed}
                    onClick={() => void save("write")}
                    aria-busy={busy}
                  >
                    {busy ? `Saving… ${Math.round(progress * 100)}%` : changed ? "Save metadata" : "No changes yet"}
                  </Button>
                  <Button
                    variant="surface"
                    className="w-full"
                    size="lg"
                    disabled={busy}
                    onClick={() => void save("sanitize")}
                  >
                    Clean a copy
                  </Button>
                </div>
              </StickyAction>
            </>
          )}
        </>
      )}
    </section>
  );
}
