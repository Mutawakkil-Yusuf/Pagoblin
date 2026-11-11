/**
 * Outputs out of the app: single file downloads directly, multiple outputs as a
 * zip. Share uses the Web Share API with files on mobile, falls back to download.
 * No network is involved anywhere.
 */
import { zip } from "fflate";
import { safeStem } from "./format";

export type OutputBlob = { blob: Blob; name: string };

function extOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1) : "pdf";
}

/** The name of the eventual download: "x.pdf", "x-pick-pages.pdf", or "x-pages.zip". */
export function outputFileName(outputs: OutputBlob[], stem: string, ext: string): string {
  const base = safeStem(stem || "output");
  if (outputs.length === 1) {
    // Keep the tool's own name for a single result: "invoice-signed.pdf" is
    // more useful than "sign.pdf". Sanitise it the same way as a fallback.
    const own = outputs[0]?.name;
    if (own) {
      const dot = own.lastIndexOf(".");
      const ownStem = dot > 0 ? own.slice(0, dot) : own;
      const ownExt = dot > 0 ? own.slice(dot + 1) : ext;
      return `${safeStem(ownStem)}.${ownExt}`;
    }
    return `${base}.${ext}`;
  }
  return `${base}-pages.zip`;
}

export async function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser a beat to start the fetch before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("Download failed. Try again.");
  }
}

export function zipBlobs(outputs: OutputBlob[]): Promise<Blob> {
  return zipOutputs(outputs);
}

/** Zip many outputs (fflate). */
export async function zipOutputs(outputs: OutputBlob[]): Promise<Blob> {
  const entries: Record<string, Uint8Array> = {};
  for (const o of outputs) {
    // Output names arrive with their extension; strip it before safeStem so
    // zip entries do not end up as "file.pdf.pdf".
    const ext = extOf(o.name);
    const stem = safeStem(o.name.replace(/\.[^.]+$/, ""));
    let name = `${stem}.${ext}`;
    let n = 1;
    while (entries[name]) name = `${stem} (${++n}).${ext}`;
    const ab = await o.blob.arrayBuffer();
    entries[name] = new Uint8Array(ab);
  }
  return new Promise((resolve, reject) => {
    zip(entries, { level: 6 }, (err, data) => {
      if (err) reject(err);
      else resolve(new Blob([data], { type: "application/zip" }));
    });
  });
}

export function canShareFiles(files: File[]): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
}

export async function shareOrDownload(outputs: OutputBlob[], zipName?: string) {
  const single = outputs.length === 1;
  const blob = single ? outputs[0].blob : await zipOutputs(outputs);
  const name = single ? outputs[0].name : (zipName ?? "pagoblin-output.zip");
  const files = [new File([blob], name, { type: blob.type })];
  if (canShareFiles(files)) {
    try {
      await navigator.share({ files, title: name });
      return;
    } catch {
      /* user cancelled or share failed; fall back to download */
    }
  }
  await downloadBlob(blob, name);
}

/** Fire the download for a done screen: works single or zip. */
export async function deliverResult(outputs: OutputBlob[], stem: string, extDefault = "pdf"): Promise<string> {
  if (outputs.length === 1) {
    const name = outputFileName(outputs, stem, extOf(outputs[0].name) || extDefault);
    await downloadBlob(outputs[0].blob, name);
    return name;
  }
  const zipName = outputFileName(outputs, stem, "zip");
  const zipBlob = await zipOutputs(outputs);
  await downloadBlob(zipBlob, zipName);
  return zipName;
}
