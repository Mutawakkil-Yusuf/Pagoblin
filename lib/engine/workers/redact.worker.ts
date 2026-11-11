/**
 * Redact worker: paint the chosen boxes onto a rendered page, then rebuild a
 * fresh PDF from those images. The original text/graphics under the boxes are
 * not copied into the output — this is not a black rectangle over live text.
 */
import { PDFDocument } from "pdf-lib";
import type { RedactInput, RedactOutput } from "../types";
import {
  assertNotCancelled,
  exposeJobs,
  openPdfChecked,
  renderPageToOffscreen,
  resetCancel,
  u8Part,
} from "../worker-shared";
import { boxToPixels } from "../impl/redact";

async function redact(input: RedactInput, onProgress: (p: number, label?: string) => void): Promise<RedactOutput> {
  resetCancel();
  const scale = Math.min(3, Math.max(1, input.scale ?? 2));
  const quality = Math.min(0.98, Math.max(0.4, input.quality ?? 0.92));
  const doc = await openPdfChecked(input.file);
  const out = await PDFDocument.create();
  const total = doc.numPages;
  let boxes = 0;

  for (let i = 0; i < total; i++) {
    assertNotCancelled();
    const pageBoxes = input.boxes.filter((b) => b.page === i + 1);
    const { canvas } = await renderPageToOffscreen(doc, i, scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    for (const box of pageBoxes) {
      const p = boxToPixels(box, canvas.width, canvas.height);
      ctx.fillStyle = "#000000";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      boxes += 1;
    }
    assertNotCancelled();
    const jpeg = await canvas.convertToBlob({ type: "image/jpeg", quality });
    const img = await out.embedJpg(await jpeg.arrayBuffer());
    const page = out.addPage([canvas.width / scale, canvas.height / scale]);
    page.drawImage(img, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
    onProgress?.((i + 1) / total, `Redacting page ${i + 1}`);
  }

  const bytes = await out.save({ useObjectStreams: true });
  onProgress?.(1, "Done");
  return { blob: new Blob([u8Part(bytes)], { type: "application/pdf" }), pages: total, boxes };
}

exposeJobs({
  redact: (input, p) => redact(input as RedactInput, p),
});
