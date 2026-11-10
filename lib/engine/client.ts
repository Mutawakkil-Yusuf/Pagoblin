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

/**
 * Spawn a fresh worker per job, terminate after. Each call site passes a
 * factory whose body contains the literal `new Worker(new URL(...))` —
 * webpack needs that literal expression to statically extract the chunk.
 */
function makeJobRunner<I, O>(makeWorker: () => Worker, kind: string): JobRunner<I, O> {
  return async (input, { onProgress } = {}) => {
    const worker = makeWorker();
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
      console.error("[pagoblin job failed]", kind, err);
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

const mkMerge = (): Worker => new Worker(new URL("./workers/merge.worker.ts", import.meta.url), { type: "module" });
const mkSplit = (): Worker => new Worker(new URL("./workers/split.worker.ts", import.meta.url), { type: "module" });
const mkCompress = (): Worker => new Worker(new URL("./workers/compress.worker.ts", import.meta.url), { type: "module" });
const mkConvert = (): Worker => new Worker(new URL("./workers/convert.worker.ts", import.meta.url), { type: "module" });
const mkPdfTool = (): Worker => new Worker(new URL("./workers/pdf-tool.worker.ts", import.meta.url), { type: "module" });
const mkThumbs = (): Worker => new Worker(new URL("./workers/thumbs.worker.ts", import.meta.url), { type: "module" });

const mk = { merge: mkMerge, split: mkSplit, compress: mkCompress, convert: mkConvert, pdfTool: mkPdfTool, thumbs: mkThumbs };
export const WORKERS = Object.keys(mk);

export const runMerge = makeJobRunner<MergeInput, MergeOutput>(mkMerge, "merge");
export const runSplit = makeJobRunner<SplitInput, SplitOutput>(mkSplit, "split");
export const runCompress = makeJobRunner<CompressInput, CompressOutput>(mkCompress, "compress");
export const runPdfToImage = makeJobRunner<PdfToImageInput, PdfToImageOutput>(mkConvert, "pdf-to-image");
export const runImageToPdf = makeJobRunner<ImageToPdfInput, ImageToPdfOutput>(mkConvert, "image-to-pdf");
export const runTextToPdf = makeJobRunner<TextToPdfInput, TextToPdfOutput>(mkConvert, "text-to-pdf");
export const runRotate = makeJobRunner<RotateInput, RotateOutput>(mkPdfTool, "rotate");
export const runSignPlace = makeJobRunner<SignPlaceInput, SignPlaceOutput>(mkPdfTool, "sign");
export const runPdfInfo = makeJobRunner<{ file: ArrayBuffer }, PdfInfoOutput>(mkThumbs, "info");
export const runThumbs = makeJobRunner<ThumbsInput, ThumbsOutput>(mkThumbs, "thumbs");

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
