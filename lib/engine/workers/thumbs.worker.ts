/** Thumbs worker: page counts, encryption detection and lazy thumbnail rendering. */
import type { PdfInfoOutput, ThumbsInput, ThumbsOutput } from "../types";
import { assertNotCancelled, exposeJobs, resetCancel, openPdfChecked, renderPageToOffscreen } from "../worker-shared";

async function info(file: ArrayBuffer): Promise<PdfInfoOutput> {
  try {
    const doc = await openPdfChecked(file);
    return { pageCount: doc.numPages, encrypted: false };
  } catch (e) {
    const ex = e as Error;
    if (ex.name === "PasswordError") return { pageCount: 0, encrypted: true };
    throw e;
  }
}

async function thumbs(input: ThumbsInput, onProgress: (p: number, label?: string) => void): Promise<ThumbsOutput> {
  resetCancel();
  const file = input.file instanceof ArrayBuffer ? input.file : await input.file.arrayBuffer();
  const doc = await openPdfChecked(file);
  const out: { page: number; blob: Blob }[] = [];
  for (let i = 0; i < input.pages.length; i++) {
    assertNotCancelled();
    const pageNo = input.pages[i];
    const { canvas } = await renderPageToOffscreen(doc, pageNo - 1, Math.max(0.2, input.width / 612));
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.72 });
    out.push({ page: pageNo, blob });
    onProgress((i + 1) / input.pages.length, `Page ${pageNo}`);
  }
  return out;
}

exposeJobs({
  info: (input, _p) => info((input as { file: ArrayBuffer }).file),
  thumbs: (input, p) => thumbs(input as ThumbsInput, p),
});
