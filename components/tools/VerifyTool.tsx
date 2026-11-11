"use client";

/**
 * Verify: SHA hashes, signature structure and a two-file comparison. All work
 * happens in a local worker; the report is assembled on the device and can be
 * downloaded as a plain text file.
 */
import { useEffect, useRef, useState } from "react";
import { DropZone } from "@/components/ui/DropZone";
import { Button } from "@/components/ui/core";
import { BusyCard, FileHead, StickyAction, ToolCard, ToolNote } from "@/components/tools/ToolParts";
import { useToolFiles } from "@/lib/store/docs";
import {
  runCompare,
  runVerify,
  CancelledError,
  EngineError,
} from "@/lib/engine/client";
import type { PdfCompareOutput, PdfFileSummary, PdfSignatureInfo } from "@/lib/engine/types";
import { fileErrors, type FileItem } from "@/lib/files";
import { formatBytes, pluralPages } from "@/lib/format";
import { calmError } from "@/lib/errors";
import { toast } from "@/lib/store/toasts";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

function formatDate(value: string): string {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function signatureStatus(signature: PdfSignatureInfo): string {
  if (!signature.signed) return "Empty field";
  if (signature.coversWholeFile) return "Covers the whole file";
  if (signature.modifiedAfterSigning) return "File changed after signing";
  return "Byte range does not match";
}

function statusTone(signature: PdfSignatureInfo): string {
  if (signature.coversWholeFile) return "bg-amber text-ink";
  if (!signature.signed) return "bg-line/60 text-muted";
  return "bg-orange text-ink";
}

function pageStatusLabel(status: "same" | "changed" | "only-a" | "only-b"): string {
  if (status === "changed") return "changed";
  if (status === "only-a") return "only first";
  if (status === "only-b") return "only second";
  return "same";
}

function pageStatusTone(status: "same" | "changed" | "only-a" | "only-b"): string {
  if (status === "changed") return "bg-orange text-ink";
  if (status === "only-a" || status === "only-b") return "bg-amber text-ink";
  return "bg-line/60 text-muted";
}

export function VerifyTool() {
  const files = useToolFiles((s) => s.files.verify);
  const add = useToolFiles((s) => s.add);
  const remove = useToolFiles((s) => s.remove);
  const clear = useToolFiles((s) => s.clear);

  const [summary, setSummary] = useState<PdfFileSummary | null>(null);
  const [compare, setCompare] = useState<PdfCompareOutput | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  const activeFiles = files.slice(0, 2);
  const key = activeFiles.map((file) => file.id).join("|");

  useEffect(() => {
    if (!activeFiles.length) {
      setSummary(null);
      setCompare(null);
      setError("");
      setBusy(false);
      return;
    }

    let alive = true;
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setError("");
    setProgress(0);
    setLabel(activeFiles.length > 1 ? "Reading both files" : "Hashing");

    void (async () => {
      try {
        if (activeFiles.length > 1) {
          const out = await runCompare(
            {
              a: activeFiles[0].file,
              b: activeFiles[1].file,
              aName: activeFiles[0].name,
              bName: activeFiles[1].name,
            },
            {
              signal: controller.signal,
              onProgress: (p, l) => {
                if (!alive) return;
                setProgress(p);
                if (l) setLabel(l);
              },
            },
          );
          if (!alive) return;
          setSummary(out.a);
          setCompare(out);
        } else {
          const out = await runVerify(
            { file: activeFiles[0].file, name: activeFiles[0].name },
            {
              signal: controller.signal,
              onProgress: (p, l) => {
                if (!alive) return;
                setProgress(p);
                if (l) setLabel(l);
              },
            },
          );
          if (!alive) return;
          setSummary(out);
          setCompare(null);
        }
        sound.play("pop");
      } catch (e) {
        if (!alive || e instanceof CancelledError) return;
        const message = calmError(e, "Could not verify this PDF. Try again.");
        setSummary(null);
        setCompare(null);
        setError(message);
        toast.error(message);
        if (e instanceof EngineError && e.code === "password") clear("verify");
      } finally {
        if (alive) setBusy(false);
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
    // The ids are the identity of the job; the File objects are stable per id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, retry]);

  const addFiles = (incoming: FileItem[]) => {
    const room = Math.max(0, 2 - activeFiles.length);
    if (!room) {
      toast.info("Two PDFs are enough to compare. Remove one first.");
      return;
    }
    add("verify", incoming.slice(0, room));
    sound.play("gulp");
    haptic("success");
  };

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error("Could not copy. Select the text instead.");
    }
  };

  const downloadReport = () => {
    if (!summary) return;
    const lines: string[] = [
      "Pagoblin Verify report",
      `Generated: ${new Date().toISOString()}`,
      "",
      `File: ${summary.name}`,
      `Size: ${summary.size} bytes`,
      `Pages: ${summary.pageCount}`,
      `SHA-256: ${summary.sha256}`,
      `SHA-1: ${summary.sha1}`,
      `SHA-512: ${summary.sha512}`,
      "",
      "Metadata",
      `  Title: ${summary.metadata.title || "not set"}`,
      `  Author: ${summary.metadata.author || "not set"}`,
      `  Creator: ${summary.metadata.creator || "not set"}`,
      `  Producer: ${summary.metadata.producer || "not set"}`,
      `  Created: ${formatDate(summary.metadata.creationDate)}`,
      `  Modified: ${formatDate(summary.metadata.modificationDate)}`,
      "",
      "Signatures",
    ];

    if (!summary.signatures.length) {
      lines.push("  None found.");
    } else {
      for (const signature of summary.signatures) {
        lines.push(
          `  ${signature.field}: ${signatureStatus(signature)}` +
            (signature.subFilter ? ` (${signature.subFilter})` : "") +
            (signature.signedAt ? `, signed ${signature.signedAt}` : ""),
        );
      }
    }

    if (compare) {
      lines.push("", "Comparison", `  First: ${compare.a.name}`, `  Second: ${compare.b.name}`);
      lines.push(`  Byte-for-byte identical: ${compare.identical ? "yes" : "no"}`);
      const changed = compare.pages.filter((page) => page.status !== "same");
      if (!changed.length) {
        lines.push("  Page text: no differences found.");
      } else {
        for (const page of changed) lines.push(`  Page ${page.page}: ${pageStatusLabel(page.status)}`);
      }
      if (compare.metadataChanges.length) {
        lines.push("  Metadata changes:");
        for (const change of compare.metadataChanges) {
          lines.push(`    ${change.field}: ${change.a || "(empty)"} -> ${change.b || "(empty)"}`);
        }
      } else {
        lines.push("  Metadata: no differences found.");
      }
    }

    lines.push("", "The signature check is structural. Certificate chains are not validated.");
    const blob = new Blob([`${lines.join("\n")}\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pagoblin-verify-report.txt";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    sound.play("success");
    haptic("success");
  };

  const signed = summary?.signatures.filter((signature) => signature.signed) ?? [];
  const emptySignatures = summary?.signatures.filter((signature) => !signature.signed) ?? [];
  const changedPages = compare?.pages.filter((page) => page.status !== "same") ?? [];
  const samePages = compare?.pages.filter((page) => page.status === "same").length ?? 0;

  return (
    <section aria-label="Verify a PDF" className="mt-8 flex flex-col gap-4">
      {!activeFiles.length ? (
        <DropZone
          accept={["pdf"]}
          label="Add a PDF to verify"
          hint="Hashes, signature structure and a second file to compare. Nothing is uploaded."
          onFiles={addFiles}
        />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {activeFiles.map((file, index) => (
              <FileHead
                key={file.id}
                name={`${index + 1}. ${file.name}`}
                meta={formatBytes(file.size)}
                onRemove={() => remove("verify", file.id)}
              />
            ))}
          </div>

          {busy ? (
            <BusyCard progress={progress} label={label || "Checking…"} onCancel={() => controllerRef.current?.abort()} />
          ) : error ? (
            <ToolCard>
              <h2 className="font-display text-h3 font-extrabold">That file did not check out</h2>
              <p className="mt-1 text-small text-muted">{error}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="md" onClick={() => setRetry((n) => n + 1)}>
                  Try again
                </Button>
                <Button variant="surface" size="md" onClick={() => clear("verify")}>
                  Start over
                </Button>
              </div>
            </ToolCard>
          ) : summary ? (
            <>
              <ToolCard>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-h3 font-extrabold">Hashes</h2>
                    <p className="mt-1 text-small text-muted">
                      Computed on this device. Compare them with a copy from the sender.
                    </p>
                  </div>
                  <span className="rounded-pill bg-amber px-2.5 py-1 text-[11px] font-bold text-ink">
                    {pluralPages(summary.pageCount)} · {formatBytes(summary.size)}
                  </span>
                </div>
                <div className="mt-3 rounded-phone-chip bg-ink/50 px-3 py-2">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">SHA-256</dt>
                  <dd className="mt-1 break-all font-mono text-[12px] leading-5 text-cream">{summary.sha256}</dd>
                  <button
                    type="button"
                    className="mt-1 min-h-[32px] text-[11px] font-bold text-amber underline"
                    onClick={() => void copy("SHA-256", summary.sha256)}
                  >
                    Copy SHA-256
                  </button>
                </div>
                <details className="mt-2 rounded-phone-chip bg-ink/50 px-3 py-2">
                  <summary className="min-h-[32px] cursor-pointer text-[12px] font-bold text-cream">
                    SHA-1 and SHA-512
                  </summary>
                  <div className="mt-2 flex flex-col gap-2">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide text-muted">SHA-1</div>
                      <div className="break-all font-mono text-[11px] leading-5 text-cream">{summary.sha1}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide text-muted">SHA-512</div>
                      <div className="break-all font-mono text-[11px] leading-5 text-cream">{summary.sha512}</div>
                    </div>
                  </div>
                </details>
              </ToolCard>

              <ToolCard>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-h3 font-extrabold">Signature check</h2>
                  <span
                    className={`rounded-pill px-2.5 py-1 text-[11px] font-bold ${
                      signed.length ? "bg-orange text-ink" : "bg-line/60 text-muted"
                    }`}
                  >
                    {signed.length ? `${signed.length} signed` : "no signature"}
                  </span>
                </div>
                {signed.length ? (
                  <ul className="mt-3 flex flex-col gap-2">
                    {signed.map((signature, index) => (
                      <li key={`${signature.field}-${index}`} className="rounded-phone-chip bg-ink/50 px-3 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[13px] font-bold text-cream">{signature.field}</span>
                          <span className={`rounded-pill px-2 py-0.5 text-[10px] font-bold ${statusTone(signature)}`}>
                            {signatureStatus(signature)}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-4 text-muted">
                          {signature.kind === "certification" ? "Certification signature" : "Signature"}
                          {signature.subFilter ? ` · ${signature.subFilter}` : ""}
                          {signature.signedAt ? ` · ${signature.signedAt}` : ""}
                        </p>
                        {signature.name || signature.reason || signature.location ? (
                          <p className="mt-1 text-[11px] leading-4 text-muted">
                            {[signature.name, signature.reason, signature.location].filter(Boolean).join(" · ")}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-small text-muted">No digital signature fields found.</p>
                )}
                {emptySignatures.length ? (
                  <p className="mt-2 text-[11px] text-muted">
                    {emptySignatures.length} empty signature {emptySignatures.length === 1 ? "field" : "fields"} found.
                  </p>
                ) : null}
                <ToolNote className="mt-3">
                  Structural check only: Pagoblin checks the byte range and whether the file changed after signing. It
                  does not validate the certificate chain or the PKCS#7 message digest.
                </ToolNote>
              </ToolCard>

              <ToolCard>
                <h2 className="font-display text-h3 font-extrabold">Document facts</h2>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                  <div className="rounded-phone-chip bg-ink/50 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Title</dt>
                    <dd className="mt-0.5 break-words text-cream">{summary.metadata.title || "Not set"}</dd>
                  </div>
                  <div className="rounded-phone-chip bg-ink/50 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Author</dt>
                    <dd className="mt-0.5 break-words text-cream">{summary.metadata.author || "Not set"}</dd>
                  </div>
                  <div className="rounded-phone-chip bg-ink/50 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Creator</dt>
                    <dd className="mt-0.5 break-words text-cream">{summary.metadata.creator || "Not set"}</dd>
                  </div>
                  <div className="rounded-phone-chip bg-ink/50 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Producer</dt>
                    <dd className="mt-0.5 break-words text-cream">{summary.metadata.producer || "Not set"}</dd>
                  </div>
                  <div className="rounded-phone-chip bg-ink/50 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Created</dt>
                    <dd className="mt-0.5 text-cream">{formatDate(summary.metadata.creationDate)}</dd>
                  </div>
                  <div className="rounded-phone-chip bg-ink/50 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Modified</dt>
                    <dd className="mt-0.5 text-cream">{formatDate(summary.metadata.modificationDate)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-[11px] text-muted">
                  {summary.fonts.length} font{summary.fonts.length === 1 ? "" : "s"} referenced ·{" "}
                  {summary.fonts.filter((font) => !font.embedded).length} not embedded ·{" "}
                  {summary.risks.embeddedFiles} attachment signal{summary.risks.embeddedFiles === 1 ? "" : "s"}.
                </p>
              </ToolCard>

              {compare ? (
                <ToolCard>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-h3 font-extrabold">Compare</h2>
                    <span
                      className={`rounded-pill px-2.5 py-1 text-[11px] font-bold ${
                        compare.identical ? "bg-amber text-ink" : "bg-orange text-ink"
                      }`}
                    >
                      {compare.identical ? "identical bytes" : `${changedPages.length} page differences`}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-small text-muted">
                    {compare.a.name} <span className="text-dim">vs</span> {compare.b.name}
                  </p>

                  {compare.identical ? (
                    <p className="mt-3 rounded-phone-chip bg-amber/15 px-3 py-2 text-small text-cream">
                      The two files are byte-for-byte identical. Their SHA-256 hashes match.
                    </p>
                  ) : changedPages.length ? (
                    <>
                      <p className="mt-3 text-small text-cream">
                        {samePages} page{samePages === 1 ? "" : "s"} match, {changedPages.length} differ.
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {changedPages.map((page) => (
                          <li
                            key={page.page}
                            className={`tnum rounded-pill px-2.5 py-1 text-[11px] font-bold ${pageStatusTone(page.status)}`}
                          >
                            p{page.page} · {pageStatusLabel(page.status)}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="mt-3 rounded-phone-chip bg-ink/50 px-3 py-2 text-small text-muted">
                      The bytes differ, but the page text and metadata match. This usually means one file was re-saved
                      or re-compressed without changing what it says.
                    </p>
                  )}

                  {compare.metadataChanges.length ? (
                    <div className="mt-3">
                      <h3 className="text-[12px] font-bold text-cream">Metadata changes</h3>
                      <ul className="mt-1 flex flex-col gap-1">
                        {compare.metadataChanges.map((change) => (
                          <li key={change.field} className="rounded-phone-chip bg-ink/50 px-3 py-2 text-[11px] text-muted">
                            <span className="font-bold text-cream">{change.field}</span>: {change.a || "(empty)"} →{" "}
                            {change.b || "(empty)"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-muted">No metadata differences.</p>
                  )}
                  <ToolNote className="mt-3">
                    Comparison uses the extracted text, not rendered pixels. A colour or layout change with the same
                    text can show as unchanged.
                  </ToolNote>
                </ToolCard>
              ) : null}

              <StickyAction>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className="w-full" size="lg" onClick={downloadReport}>
                    Download report
                  </Button>
                  <Button variant="surface" className="w-full" size="lg" onClick={() => clear("verify")}>
                    Start over
                  </Button>
                </div>
              </StickyAction>
            </>
          ) : null}

          {activeFiles.length === 1 ? (
            <DropZone
              accept={["pdf"]}
              label="Add a second PDF to compare"
              hint="Page text, metadata and byte hashes will be compared."
              onFiles={addFiles}
            />
          ) : null}
        </>
      )}
    </section>
  );
}
