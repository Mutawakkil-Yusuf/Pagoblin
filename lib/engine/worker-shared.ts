/**
 * Worker-side helpers shared by every engine worker: progress throttling,
 * cooperative cancellation, and pdf.js bootstrapping (loads inside this worker;
 * pdf.js spawns its own nested worker from /pdfjs/*).
 */
import type { PdfData } from "./types";

let cancelled = false;
export function resetCancel() {
  cancelled = false;
}
export function isCancelled(): boolean {
  return cancelled;
}
export function cancelJob() {
  cancelled = true;
}
export function assertNotCancelled(): void {
  if (cancelled) {
    const err = new Error("canceled by job");
    err.name = "CancelledError";
    throw err;
  }
}

/** Throttle progress emits to at least ~every 120 ms, and always pass 0 and 1. */
export function createProgress(onProgressImpl?: (p: number, label?: string) => void) {
  let last = 0;
  return (p: number, label?: string) => {
    const now = Date.now();
    if (p <= 0 || p >= 1 || now - last >= 120) {
      last = now;
      try {
        onProgressImpl?.(p, label);
      } catch {
        /* progress is best effort */
      }
    }
  };
}

/** Read a File into an ArrayBuffer inside the worker. */
export async function readToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}

/**
 * Normalise a PDF source inside the worker. Passing the original `File` keeps
 * the main thread from making a second full-size copy before the job starts.
 */
export async function readPdfData(data: PdfData): Promise<ArrayBuffer> {
  if (data instanceof ArrayBuffer) return data;
  return await data.arrayBuffer();
}

let pdfjsLoading: Promise<typeof import("pdfjs-dist")> | null = null;

/** Load pdf.js inside this worker. Prints to OffscreenCanvas; pdf.js spawns its
 * own nested worker from /pdfjs/* (self-hosted, not the bundled copy). */
export function getPdfjs(): Promise<typeof import("pdfjs-dist")> {
  if (!pdfjsLoading) {
    pdfjsLoading = import("pdfjs-dist").then((ns) => {
      ns.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
      return ns;
    });
  }
  return pdfjsLoading;
}

export type PdfDoc = Awaited<ReturnType<Awaited<ReturnType<typeof getPdfjs>>["getDocument"]>["promise"]>;

export async function openPdf(data: PdfData): Promise<PdfDoc> {
  const pdfjs = await getPdfjs();
  const bytes = await readPdfData(data);
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    isEvalSupported: false,
    // PDFs that rely on the standard 14 fonts or CJK CMaps need these
    // self-hosted files. Without them pdf.js warns and draws missing glyphs
    // (boxes) in previews, PDF→image, redaction and OCR.
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
    // Always use the bundled font data, not whatever fonts the device happens
    // to expose. That keeps previews and raster output consistent offline.
    useSystemFonts: false,
  });
  return await loadingTask.promise;
}

/** Try opening a PDF and classify the failure for calm error copy. */
export async function openPdfChecked(data: PdfData): Promise<PdfDoc> {
  try {
    return await openPdf(data);
  } catch (e) {
    const ex = e as Error & { name?: string };
    if (ex.name === "PasswordException") {
      const err = new Error("password-protected");
      err.name = "PasswordError";
      throw err;
    }
    throw e;
  }
}

/** Render one page to an OffscreenCanvas and return the canvas + its pixels context. */
export async function renderPageToOffscreen(
  doc: PdfDoc,
  pageIndex0: number,
  scale: number,
): Promise<{ canvas: OffscreenCanvas; width: number; height: number }> {
  const page = await doc.getPage(pageIndex0 + 1);
  const viewport = page.getViewport({ scale });
  const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // pdf.js v4 supports rendering into OffscreenCanvas contexts.
  await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise;
  page.cleanup();
  return { canvas, width: canvas.width, height: canvas.height };
}

export function canvasToBlob(canvas: OffscreenCanvas, type: string, quality?: number): Promise<Blob> {
  return canvas.convertToBlob({ type, quality });
}

/**
 * Typed-array → BlobPart helper for TS 7's generic typed arrays: pdf-lib save()
 * returns Uint8Array<ArrayBufferLike>, which Blob accepts at runtime but not
 * in types. Views backed by a real ArrayBuffer pass cleanly.
 */
export function u8Part(bytes: Uint8Array): BlobPart {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer as ArrayBuffer;
}

/**
 * One comlink API surface for every engine worker:
 *   run({ kind, input }, onProgress) ; cancel()
 * Keeps client.ts generic and gives each job type exactly one worker.
 */
import * as Comlink from "comlink";

export function exposeJobs(handlers: Record<string, (input: unknown, onProgress: (p: number, label?: string) => void) => Promise<unknown>>) {
  Comlink.expose({
    run: async ({ kind, input }: { kind: string; input: unknown }, onProgressImpl: (p: number, label?: string) => void) => {
      const handler = handlers[kind];
      if (!handler) throw new Error(`unknown job kind: ${kind}`);
      const progress = createProgress(onProgressImpl);
      return await handler(input, progress);
    },
    cancel: () => {
      cancelJob();
    },
  });
}

