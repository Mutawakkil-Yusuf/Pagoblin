/** Engine B ("Flatten"): render each page with pdf.js at a given dpi, JPEG re-encode,
 * rebuild with pdf-lib. Text becomes an image; the UI labels that clearly. */
import { PDFDocument } from "pdf-lib";
import type { CompressEngine } from "./engine-types";
import { assertNotCancelled, openPdfChecked, renderPageToOffscreen } from "../worker-shared";

export const flattenCompressEngine: CompressEngine = {
  id: "flatten",
  label: "Flatten",
  async availability() {
    return true;
  },
  async attempt(inputBytes, fileName, dpi, signalCheck) {
    void fileName;
    const doc = await openPdfChecked(inputBytes);
    const pageCount = doc.numPages;
    const out = await PDFDocument.create();
    const scale = dpi / 72;
    for (let i = 0; i < pageCount; i++) {
      signalCheck?.();
      const { canvas } = await renderPageToOffscreen(doc, i, Math.max(0.25, scale));
      const jpeg = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.72 });
      const buf = await jpeg.arrayBuffer();
      const img = await out.embedJpg(buf);
      const page = out.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
    const bytes = await out.save({ useObjectStreams: true });
    return { size: bytes.byteLength, bytes };
  },
};
