/** Convert worker: PDF to image / image to PDF / text to PDF. */
import { PDFDocument } from "pdf-lib";
import type {
  ImageToPdfInput,
  ImageToPdfOutput,
  PdfToImageInput,
  PdfToImageOutput,
  TextToPdfInput,
} from "../types";
import {
  assertNotCancelled,
  exposeJobs,
  resetCancel,
  openPdfChecked,
  renderPageToOffscreen,
  u8Part,
} from "../worker-shared";
import { textToPdfMain } from "../impl/text";

async function pdfToImage(input: PdfToImageInput, onProgress: (p: number, label?: string) => void): Promise<PdfToImageOutput> {
  resetCancel();
  const doc = await openPdfChecked(input.file);
  const total = doc.numPages;
  const pages = input.pages === "all" ? Array.from({ length: total }, (_, i) => i + 1) : input.pages;
  const mime = input.format === "png" ? "image/png" : input.format === "jpg" ? "image/jpeg" : "image/webp";
  const ext = input.format === "jpg" ? "jpg" : input.format;
  const blobs: { blob: Blob; name: string }[] = [];
  for (let i = 0; i < pages.length; i++) {
    assertNotCancelled();
    const pageNo = pages[i];
    const { canvas } = await renderPageToOffscreen(doc, pageNo - 1, input.scale);
    assertNotCancelled();
    const blob = await canvas.convertToBlob({ type: mime, quality: input.quality });
    blobs.push({ blob, name: `${ext}-${String(pageNo).padStart(3, "0")}` });
    onProgress((i + 1) / pages.length, `Page ${pageNo}`);
  }
  onProgress(1, "Done");
  return { blobs };
}

async function decodeToJpegOrPng(buffer: ArrayBuffer, type: string): Promise<{ bytes: ArrayBuffer; mime: string }> {
  // pdf-lib embeds jpeg/png/svg directly. Anything else goes through a canvas re-encode.
  if (type.includes("jpeg") || type.includes("jpg")) return { bytes: buffer, mime: "image/jpeg" };
  if (type.includes("png")) return { bytes: buffer, mime: "image/png" };
  const blob = new Blob([buffer]);
  const bmp = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bmp.width, bmp.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0);
  const out = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 });
  return { bytes: await out.arrayBuffer(), mime: "image/jpeg" };}

async function imageToPdf(input: ImageToPdfInput, onProgress: (p: number, label?: string) => void): Promise<ImageToPdfOutput> {
  resetCancel();
  const doc = await PDFDocument.create();
  const A4: [number, number] = [595.28, 841.89];
  for (let i = 0; i < input.images.length; i++) {
    assertNotCancelled();
    const im = input.images[i];
    const { bytes, mime } = await decodeToJpegOrPng(im.buffer, im.type);
    const img = mime === "image/png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    if (input.pageSize === "fit") {
      const pad = Math.round((input.margin / 100) * Math.max(img.width, img.height));
      const w = img.width + pad * 2;
      const h = img.height + pad * 2;
      const page = doc.addPage([w, h]);
      page.drawImage(img, { x: pad, y: pad, width: img.width, height: img.height });
    } else {
      const page = doc.addPage(A4);
      const margin = Math.max(0, input.margin); // already points
      const availW = A4[0] - margin * 2;
      const availH = A4[1] - margin * 2;
      const scale = Math.min(availW / img.width, availH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      page.drawImage(img, { x: (A4[0] - w) / 2, y: (A4[1] - h) / 2, width: w, height: h });
    }
    onProgress((i + 1) / input.images.length, im.name);
  }
  const bytes = await doc.save({ useObjectStreams: true });
  onProgress(1, "Done");
  return { blob: new Blob([u8Part(bytes)], { type: "application/pdf" }) };
}

async function textToPdf(input: TextToPdfInput, onProgress: (p: number, label?: string) => void): Promise<{ blob: Blob; pages: number }> {
  return textToPdfMain(input, onProgress);
}
exposeJobs({
  "pdf-to-image": (input, p) => pdfToImage(input as PdfToImageInput, p),
  "image-to-pdf": (input, p) => imageToPdf(input as ImageToPdfInput, p),
  "text-to-pdf": (input, p) => textToPdf(input as TextToPdfInput, p),
});
