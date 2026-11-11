/** pdf-tool worker: rotate pages and place signatures (small pdf-lib jobs). */
import { PDFDocument, degrees } from "pdf-lib";
import type { RotateInput, RotateOutput, SignPlaceInput, SignPlaceOutput } from "../types";
import { assertNotCancelled, exposeJobs, readPdfData, resetCancel, u8Part } from "../worker-shared";

async function rotate(input: RotateInput, onProgress: (p: number, label?: string) => void): Promise<RotateOutput> {
  resetCancel();
  const doc = await PDFDocument.load(input.file, { ignoreEncryption: false });
  const total = doc.getPageCount();
  for (const step of input.steps) {
    assertNotCancelled();
    const targets: number[] = step.pages === "all" ? doc.getPageIndices() : step.pages.map((p) => p - 1);
    for (const idx of targets) {
      if (idx < 0 || idx >= total) continue;
      const page = doc.getPage(idx);
      page.setRotation(degrees((page.getRotation().angle + step.rotateBy) % 360));
    }
    onProgress(1, "Rotated");
  }
  const bytes = await doc.save({ useObjectStreams: true });
  return { blob: new Blob([u8Part(bytes)], { type: "application/pdf" }) };
}

async function signPlace(input: SignPlaceInput, onProgress: (p: number, label?: string) => void): Promise<SignPlaceOutput> {
  resetCancel();
  const file = await readPdfData(input.file);
  const doc = await PDFDocument.load(file, { ignoreEncryption: false });
  const img = await doc.embedPng(input.signaturePng);
  for (let i = 0; i < input.placements.length; i++) {
    assertNotCancelled();
    const pl = input.placements[i];
    const page = doc.getPage(Math.min(pl.pageIndex, doc.getPageCount() - 1));
    const { width, height } = page.getSize();
    // Placements arrive in "top-left origin" fractions of the page from the UI;
    // draw below converts to PDF user units (bottom-left origin).
    const w = pl.width * width;
    const h = pl.height * height;
    const x = pl.x * width;
    const y = height - (pl.y * height) - h;
    page.drawImage(img, { x, y, width: w, height: h, rotate: degrees(pl.rotation || 0) });
    onProgress((i + 1) / input.placements.length, "Placing");
  }
  const bytes = await doc.save({ useObjectStreams: true });
  onProgress(1, "Done");
  return { blob: new Blob([u8Part(bytes)], { type: "application/pdf" }) };
}

exposeJobs({
  rotate: (input, p) => rotate(input as RotateInput, p),
  sign: (input, p) => signPlace(input as SignPlaceInput, p),
});
