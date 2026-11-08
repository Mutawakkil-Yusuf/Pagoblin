"use client";

/**
 * Job client: wraps every engine worker with the job contract
 *   { id, input, onProgress(p, label), signal }
 * Workers run one job each and are terminated afterwards, which guarantees
 * WASM memory (Ghostscript) is fully released even after failed trials.
 * Errors are classified so tools can show calm, specific copy.
 */
import * as Comlink from "comlink";
import type {
  CompressInput,
  CompressOutput,
  ImageToPdfInput,
  ImageToPdfOutput,
  MergeInput,
  MergeOutput,
  PdfInfoOutput,
  PdfToImageInput,
  PdfToImageOutput,
  RotateInput,
  RotateOutput,
  SignPlaceInput,
  SignPlaceOutput,
  SplitInput,
  SplitOutput,
  TextToPdfInput,
  TextToPdfOutput,
  ThumbsInput,
  ThumbsOutput,
} from "./types";

export class CancelledError extends Error {
  constructor() {
    super("cancelled");
    this.name = "CancelledError";
  }
}

export class EngineError extends Error {
  code: "password" | "oom" | "failed";
  constructor(code: "password" | "oom" | "failed", detail?: unknown, raw?: Error) {
    super(
      raw && raw.message
        ? raw.message
        : typeof detail === "string"
          ? detail
          : "Something went wrong. Try again.",
    );
    this.code = code;
  }
}

export type JobRunner<I, O> = (
  input: I,
  opts?: { onProgress?: (p: number, label?: string) => void },
) => Promise<O>;

type AnyApi = {
  run: (envelope: unknown, onProgress: (p: number, label?: string) => void) => Promise<unknown>;
  cancel: () => void;
};

/** Spawn a fresh worker per job, terminate after. Paths are literals so the bundler can extract them. */
function makeJobRunner<I, O>(workerPath: string, kind: string): JobRunner<I, O> {
  return async (input, { onProgress } = {}) => {
    const worker = new Worker(new URL(workerPath, import.meta.url), { type: "module" });
    const api = Comlink.wrap<Comlink.Remote<AnyApi>>(worker);
    const progressProxy = Comlink.proxy((p: number, label?: string) => {
      onProgress?.(p, label);
    });
    try {
      const result = (await api.run({ kind, input }, progressProxy)) as O;
      return result;
    } catch (err) {
      const raw = err instanceof Error ? err : undefined;
      const msg = raw ? raw.message : String(err);
      if (raw?.name === "CancelledError" || msg.includes("canceled by job")) throw new CancelledError();
      // Comlink stacks arrive as string "Error: <msg>" sometimes.
      if (/password|encrypt/i.test(msg)) throw new EngineError("password", undefined, raw);
      if (/out of memory|Array buffer allocation|RangeError|allocation/i.test(msg)) throw new EngineError("oom", undefined, raw);
      throw new EngineError("failed", undefined, raw);
    } finally {
      try {
        worker.terminate();
      } catch {
        /* ignore */
      }
    }
  };
}

const literal = <T extends string>(p: T): T => p;

export const WORKERS = {
  merge: literal("./workers/merge.worker.ts"),
  split: literal("./workers/split.worker.ts"),
  compress: literal("./workers/compress.worker.ts"),
  convert: literal("./workers/convert.worker.ts"),
  pdfTool: literal("./workers/pdf-tool.worker.ts"),
  thumbs: literal("./workers/thumbs.worker.ts"),
} as const;

export const runMerge = makeJobRunner<MergeInput, MergeOutput>(WORKERS.merge, "merge");
export const runSplit = makeJobRunner<SplitInput, SplitOutput>(WORKERS.split, "split");
export const runCompress = makeJobRunner<CompressInput, CompressOutput>(WORKERS.compress, "compress");
export const runPdfToImage = makeJobRunner<PdfToImageInput, PdfToImageOutput>(WORKERS.convert, "pdf-to-image");
export const runImageToPdf = makeJobRunner<ImageToPdfInput, ImageToPdfOutput>(WORKERS.convert, "image-to-pdf");
export const runTextToPdf = makeJobRunner<TextToPdfInput, TextToPdfOutput>(WORKERS.convert, "text-to-pdf");
export const runRotate = makeJobRunner<RotateInput, RotateOutput>(WORKERS.pdfTool, "rotate");
export const runSignPlace = makeJobRunner<SignPlaceInput, SignPlaceOutput>(WORKERS.pdfTool, "sign");
export const runPdfInfo = makeJobRunner<{ file: ArrayBuffer }, PdfInfoOutput>(WORKERS.thumbs, "info");
export const runThumbs = makeJobRunner<ThumbsInput, ThumbsOutput>(WORKERS.thumbs, "thumbs");

/** Read a pageCount cheaply (with an in-memory memo on the client side). */
export async function readPageCount(file: File): Promise<{ pageCount: number | null; encrypted: boolean }> {
  try {
    const buffer = await file.arrayBuffer();
    const info = await runPdfInfo({ file: buffer });
    return { pageCount: info.pageCount || null, encrypted: info.encrypted };
  } catch (e) {
    if (e instanceof EngineError && e.code === "password") return { pageCount: 0, encrypted: true };
    if (e instanceof EngineError && e.code === "oom") return { pageCount: null, encrypted: false };
    throw e;
  }
}
