"use client";

/**
 * Local OCR pipeline.
 *
 * Pages are rendered by the existing PDF.js worker, read by tesseract.js (which
 * runs in its own worker), then rebuilt as a searchable PDF: the page image is
 * drawn first and every recognised word is placed over it as invisible,
 * selectable text. Engine files and language packs are served from this origin
 * only; the PDF itself never leaves the device.
 */
import { CancelledError, runPdfToImage } from "./client";
import type { PdfData } from "./types";

export type OcrLang = "eng" | "spa" | "fra" | "deu";
export type OcrOutputMode = "pdf" | "text";

export const OCR_LANGS: { key: OcrLang; label: string; hint: string }[] = [
  { key: "eng", label: "English", hint: "eng" },
  { key: "spa", label: "Español", hint: "spa" },
  { key: "fra", label: "Français", hint: "fra" },
  { key: "deu", label: "Deutsch", hint: "deu" },
];

const RENDER_SCALE = 3;
const JPEG_QUALITY = 0.9;
const CHUNK_PAGES = 4;

type Word = {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

type OcrResult = {
  blob: Blob;
  pages: number;
  words: number;
  chars: number;
  text: string;
  mode: OcrOutputMode;
};

/** PDF text needs WinAnsi-safe characters for the standard Helvetica font. */
const PUNCT: Record<string, string> = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201A": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u201E": '"',
  "\u2013": "-",
  "\u2014": "-",
  "\u2026": "...",
  "\u00A0": " ",
};

function winAnsi(text: string): string {
  let out = "";
  for (const ch of text) {
    const mapped = PUNCT[ch] ?? ch;
    for (const c of mapped) {
      const code = c.codePointAt(0) ?? 0;
      if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff)) out += c;
    }
  }
  return out.trim();
}

export async function ocrPdf(input: {
  file: PdfData;
  pages: number[];
  lang: OcrLang;
  mode: OcrOutputMode;
  signal?: AbortSignal;
  onProgress?: (p: number, label?: string) => void;
}): Promise<OcrResult> {
  const { file, pages, lang, mode, signal, onProgress } = input;
  if (!pages.length) throw new Error("Choose at least one page.");
  if (signal?.aborted) throw new CancelledError();

  const Tesseract = await import("tesseract.js");
  const { PDFDocument, StandardFonts } = await import("pdf-lib");

  const worker = await Tesseract.createWorker(lang, Tesseract.OEM.LSTM_ONLY, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr/core",
    langPath: "/ocr/lang",
    workerBlobURL: false,
    logger: () => {
      /* page-level progress is reported by the pipeline below */
    },
    errorHandler: (error: unknown) => {
      console.error("[pagoblin ocr worker]", error);
    },
  });

  let aborted = false;
  const onAbort = () => {
    aborted = true;
    void worker.terminate().catch(() => {});
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const wantPdf = mode === "pdf";
    const doc = wantPdf ? await PDFDocument.create() : null;
    const font = doc ? await doc.embedFont(StandardFonts.Helvetica) : null;
    const pageTexts: string[] = [];
    let words = 0;
    let chars = 0;

    for (let start = 0; start < pages.length; start += CHUNK_PAGES) {
      if (aborted || signal?.aborted) throw new CancelledError();
      const chunk = pages.slice(start, start + CHUNK_PAGES);
      onProgress?.(start / pages.length, `Rendering page ${chunk[0]}`);
      const images = await runPdfToImage(
        {
          file,
          format: "jpg",
          quality: JPEG_QUALITY,
          scale: RENDER_SCALE,
          pages: chunk,
        },
        { signal },
      );

      for (let i = 0; i < images.blobs.length; i++) {
        if (aborted || signal?.aborted) throw new CancelledError();
        const image = images.blobs[i];
        const pageNo = chunk[i] ?? start + i + 1;
        onProgress?.((start + i) / pages.length, `Reading page ${pageNo}`);
        const result = await worker.recognize(image.blob, {}, { blocks: true });
        const data = result.data;
        const recognised: Word[] =
          data.blocks?.flatMap((block) =>
            block.paragraphs.flatMap((paragraph) =>
              paragraph.lines.flatMap((line) => line.words.map((word) => ({
                text: word.text,
                confidence: word.confidence,
                bbox: word.bbox,
              }))),
            ),
          ) ?? [];
        const usableWords = recognised.filter((word) => word.text && word.confidence >= 30);
        if (!doc) words += usableWords.length;

        if (doc && font) {
          const bitmap = await createImageBitmap(image.blob);
          const imgW = bitmap.width;
          const imgH = bitmap.height;
          bitmap.close();

          const pageW = imgW / RENDER_SCALE;
          const pageH = imgH / RENDER_SCALE;
          const page = doc.addPage([pageW, pageH]);
          const jpg = await doc.embedJpg(await image.blob.arrayBuffer());
          page.drawImage(jpg, { x: 0, y: 0, width: pageW, height: pageH });

          for (const rawWord of usableWords) {
            const text = winAnsi(rawWord.text);
            if (!text) continue;
            const box = rawWord.bbox;
            const boxH = Math.max(1, box.y1 - box.y0) / RENDER_SCALE;
            const boxW = Math.max(1, box.x1 - box.x0) / RENDER_SCALE;
            let size = boxH * 0.85;
            try {
              const widthAtOne = font.widthOfTextAtSize(text, 1);
              if (widthAtOne > 0) size = Math.min(size, boxW / widthAtOne);
            } catch {
              /* keep the height-based size */
            }
            if (size < 0.8) continue;
            const x = Math.max(0, Math.min(pageW, box.x0 / RENDER_SCALE));
            const y = Math.max(0, Math.min(pageH, (imgH - box.y1) / RENDER_SCALE + boxH * 0.18));
            try {
              page.drawText(text, { x, y, size, font, opacity: 0 });
            } catch {
              /* a word the standard font cannot encode stays in the image */
            }
            words += 1;
            chars += text.length;
          }
        }

        pageTexts.push(data.text.trim());
        onProgress?.(((start + i + 1) / pages.length) * 0.95, `Page ${pageNo} read`);
      }
    }

    if (aborted || signal?.aborted) throw new CancelledError();
    const text = pageTexts.filter(Boolean).join("\n\n");
    if (mode === "text") {
      onProgress?.(1, "Done");
      return {
        blob: new Blob([text], { type: "text/plain;charset=utf-8" }),
        pages: pages.length,
        words,
        chars: text.length,
        text,
        mode,
      };
    }

    if (!doc) throw new Error("The searchable PDF could not be created.");
    onProgress?.(0.98, "Building the PDF");
    const bytes = await doc.save({ useObjectStreams: true });
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    onProgress?.(1, "Done");
    return {
      blob: new Blob([copy.buffer], { type: "application/pdf" }),
      pages: pages.length,
      words,
      chars: text.length,
      text,
      mode,
    };
  } finally {
    signal?.removeEventListener("abort", onAbort);
    if (!aborted) {
      await worker.terminate().catch(() => {});
    }
  }
}
