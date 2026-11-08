/**
 * Split implementation, node-safe. The worker wraps this so the exact same
 * code can be unit-tested in node.
 */
import { PDFDocument } from "pdf-lib";
import type { SplitInput, SplitOutput } from "../types";
import { assertNotCancelled, resetCancel, u8Part } from "../worker-shared";

async function load(buffer: ArrayBuffer): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(buffer, { ignoreEncryption: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/password|encrypt/i.test(msg)) {
      const err = new Error("password-protected");
      err.name = "PasswordError";
      throw err;
    }
    throw e;
  }
}

export async function splitMain(
  input: SplitInput,
  onProgress?: (p: number, label?: string) => void,
): Promise<SplitOutput> {
  resetCancel();
  const src = await load(input.file);
  const total = src.getPageCount();
  const blobs: { blob: Blob; name: string }[] = [];

  if (input.mode === "pick") {
    const dst = await PDFDocument.create();
    const copied = await dst.copyPages(src, input.pages.map((p) => p - 1));
    copied.forEach((p) => dst.addPage(p));
    const bytes = await dst.save({ useObjectStreams: true });
    blobs.push({ blob: new Blob([u8Part(bytes)], { type: "application/pdf" }), name: "picked-pages" });
    onProgress?.(1, "Packed up");
  } else if (input.mode === "ranges") {
    for (let gi = 0; gi < input.ranges.length; gi++) {
      assertNotCancelled();
      const g = input.ranges[gi];
      const dst = await PDFDocument.create();
      const idx: number[] = [];
      for (let p = g.start; p <= Math.min(g.end, total); p++) idx.push(p - 1);
      const copied = await dst.copyPages(src, idx);
      copied.forEach((p) => dst.addPage(p));
      const bytes = await dst.save({ useObjectStreams: true });
      blobs.push({
        blob: new Blob([u8Part(bytes)], { type: "application/pdf" }),
        name: `pages-${g.start}-${Math.min(g.end, total)}`,
      });
      onProgress?.((gi + 1) / input.ranges.length, `Range ${g.start} to ${g.end}`);
    }
  } else {
    // every page becomes its own PDF
    for (let p = 0; p < total; p++) {
      assertNotCancelled();
      const dst = await PDFDocument.create();
      const copied = await dst.copyPages(src, [p]);
      copied.forEach((pg) => dst.addPage(pg));
      const bytes = await dst.save({ useObjectStreams: true });
      blobs.push({ blob: new Blob([u8Part(bytes)], { type: "application/pdf" }), name: `page-${p + 1}` });
      onProgress?.((p + 1) / total, `Page ${p + 1} of ${total}`);
    }
  }
  onProgress?.(1, "Done");
  return { blobs, count: blobs.length };
}
