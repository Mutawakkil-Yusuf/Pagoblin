"use client";

/**
 * Job client: wraps every engine worker with the job contract
 *   { id, input, onProgress(p, label), signal }
 * Workers run one job each and are terminated afterwards, which guarantees
 * WASM memory (Ghostscript) is fully released even after failed trials.
 * Errors are classified so tools can show calm, specific copy.
 */
import * as Comlink from "comlink";
import { protectArgs, unlockArgs } from "./impl/qpdf";
import type {
  CompressInput,
  CompressOutput,
  FormFillInput,
  FormFillOutput,
  FormInspectInput,
  FormInspectOutput,
  ImageToPdfInput,
  ImageToPdfOutput,
  MergeInput,
  MergeOutput,
  OrganizeInput,
  OrganizeOutput,
  PdfData,
  PdfInfoOutput,
  PdfMetadataInput,
  PdfMetadataOutput,
  PdfMetadataWriteInput,
  PdfMetadataWriteOutput,
  PdfSanitizeInput,
  PdfSanitizeOutput,
  PdfTextInput,
  PdfTextOutput,
  PdfToImageInput,
  PdfToImageOutput,
  ProtectInput,
  RedactInput,
  RedactOutput,
  RotateInput,
  RotateOutput,
  SecurityOutput,
  SignPlaceInput,
  SignPlaceOutput,
  SplitInput,
  SplitOutput,
  TextToPdfInput,
  TextToPdfOutput,
  ThumbsInput,
  ThumbsOutput,
  UnlockInput,
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

export type JobOptions = {
  onProgress?: (p: number, label?: string) => void;
  /** Aborting asks the worker to stop at its next checkpoint, then terminates it. */
  signal?: AbortSignal;
};

export type JobRunner<I, O> = (input: I, opts?: JobOptions) => Promise<O>;

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
  return async (input, { onProgress, signal } = {}) => {
    const worker = makeWorker();
    if (signal?.aborted) {
      try {
        worker.terminate();
      } catch {
        /* ignore */
      }
      throw new CancelledError();
    }
    const api = Comlink.wrap<Comlink.Remote<AnyApi>>(worker);
    const progressProxy = Comlink.proxy((p: number, label?: string) => {
      onProgress?.(p, label);
    });
    const askCancel = () => {
      try {
        void Promise.resolve(api.cancel()).catch(() => {});
      } catch {
        /* worker may already be gone */
      }
    };
    signal?.addEventListener("abort", askCancel, { once: true });
    try {
      const result = (await api.run({ kind, input }, progressProxy)) as O;
      if (signal?.aborted) throw new CancelledError();
      return result;
    } catch (err) {
      const raw = err instanceof Error ? err : undefined;
      const msg = raw ? raw.message : String(err);
      if (signal?.aborted) throw new CancelledError();
      console.error("[pagoblin job failed]", kind, err);
      if (raw?.name === "CancelledError" || msg.includes("canceled by job")) throw new CancelledError();
      // Comlink stacks arrive as string "Error: <msg>" sometimes.
      if (/password|encrypt/i.test(msg)) throw new EngineError("password", undefined, raw);
      if (/out of memory|Array buffer allocation|RangeError|allocation/i.test(msg)) throw new EngineError("oom", undefined, raw);
      throw new EngineError("failed", undefined, raw);
    } finally {
      signal?.removeEventListener("abort", askCancel);
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
const mkOrganize = (): Worker => new Worker(new URL("./workers/organize.worker.ts", import.meta.url), { type: "module" });
const mkMetadata = (): Worker => new Worker(new URL("./workers/metadata.worker.ts", import.meta.url), { type: "module" });
const mkPdfText = (): Worker => new Worker(new URL("./workers/pdf-text.worker.ts", import.meta.url), { type: "module" });
const mkRedact = (): Worker => new Worker(new URL("./workers/redact.worker.ts", import.meta.url), { type: "module" });
const mkForms = (): Worker => new Worker(new URL("./workers/forms.worker.ts", import.meta.url), { type: "module" });

const mk = {
  merge: mkMerge,
  split: mkSplit,
  compress: mkCompress,
  convert: mkConvert,
  pdfTool: mkPdfTool,
  thumbs: mkThumbs,
  organize: mkOrganize,
  metadata: mkMetadata,
  pdfText: mkPdfText,
  redact: mkRedact,
  forms: mkForms,
};
export const WORKERS = Object.keys(mk);

export const runMerge = makeJobRunner<MergeInput, MergeOutput>(mkMerge, "merge");
export const runSplit = makeJobRunner<SplitInput, SplitOutput>(mkSplit, "split");
export const runCompress = makeJobRunner<CompressInput, CompressOutput>(mkCompress, "compress");
export const runPdfToImage = makeJobRunner<PdfToImageInput, PdfToImageOutput>(mkConvert, "pdf-to-image");
export const runImageToPdf = makeJobRunner<ImageToPdfInput, ImageToPdfOutput>(mkConvert, "image-to-pdf");
export const runTextToPdf = makeJobRunner<TextToPdfInput, TextToPdfOutput>(mkConvert, "text-to-pdf");
export const runRotate = makeJobRunner<RotateInput, RotateOutput>(mkPdfTool, "rotate");
export const runSignPlace = makeJobRunner<SignPlaceInput, SignPlaceOutput>(mkPdfTool, "sign");
export const runPdfInfo = makeJobRunner<{ file: PdfData }, PdfInfoOutput>(mkThumbs, "info");
export const runThumbs = makeJobRunner<ThumbsInput, ThumbsOutput>(mkThumbs, "thumbs");
export const runOrganize = makeJobRunner<OrganizeInput, OrganizeOutput>(mkOrganize, "organize");
export const runMetadataRead = makeJobRunner<PdfMetadataInput, PdfMetadataOutput>(mkMetadata, "read");
export const runMetadataWrite = makeJobRunner<PdfMetadataWriteInput, PdfMetadataWriteOutput>(mkMetadata, "write");
export const runSanitize = makeJobRunner<PdfSanitizeInput, PdfSanitizeOutput>(mkMetadata, "sanitize");
export const runPdfText = makeJobRunner<PdfTextInput, PdfTextOutput>(mkPdfText, "extract");
export const runRedact = makeJobRunner<RedactInput, RedactOutput>(mkRedact, "redact");
export const runFormInspect = makeJobRunner<FormInspectInput, FormInspectOutput>(mkForms, "inspect");
export const runFormFill = makeJobRunner<FormFillInput, FormFillOutput>(mkForms, "fill");

/* ---------- qpdf (protect / unlock) ---------- */
type QpdfReply = {
  ok: boolean;
  bytes?: Uint8Array;
  error?: string;
  progress?: boolean;
  label?: string;
};

type QpdfRequest = { mode: "protect" | "unlock"; input: PdfData; args: string[] };

function bytesToBlob(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy.buffer], { type: "application/pdf" });
}

/** qpdf runs in a small classic worker (public/qpdf-worker.js) so its WASM memory is released after each job. */
function runQpdf(request: QpdfRequest, opts: JobOptions = {}): Promise<SecurityOutput> {
  return new Promise((resolve, reject) => {
    const worker = new Worker("/qpdf-worker.js");
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      opts.signal?.removeEventListener("abort", onAbort);
      try {
        worker.terminate();
      } catch {
        /* ignore */
      }
      fn();
    };
    const onAbort = () => finish(() => reject(new CancelledError()));
    if (opts.signal?.aborted) {
      finish(() => reject(new CancelledError()));
      return;
    }
    opts.signal?.addEventListener("abort", onAbort, { once: true });
    worker.onmessage = (e: MessageEvent<QpdfReply>) => {
      const data = e.data;
      if (data.progress) {
        opts.onProgress?.(data.label === "Done" ? 1 : 0.5, data.label);
        return;
      }
      if (!data.ok || !data.bytes) {
        const msg = data.error || "qpdf failed";
        console.error("[pagoblin qpdf failed]", msg);
        const err = /invalid password/i.test(msg)
          ? new EngineError("password", "That password did not open this PDF.")
          : new EngineError("failed", "The security tool could not finish this file.");
        finish(() => reject(err));
        return;
      }
      const blob = bytesToBlob(data.bytes);
      finish(() => resolve({ blob, encrypted: request.mode === "protect" }));
    };
    worker.onerror = (e) => {
      finish(() => reject(new EngineError("failed", e.message || "The security tool failed to start.")));
    };
    worker.postMessage(request);
  });
}

export function runProtect(input: ProtectInput, opts?: JobOptions): Promise<SecurityOutput> {
  return runQpdf(
    {
      mode: "protect",
      input: input.file,
      args: protectArgs({
        userPassword: input.userPassword,
        ownerPassword: input.ownerPassword,
        keyLength: input.keyLength,
        permissions: input.permissions,
      }),
    },
    opts,
  );
}

export function runUnlock(input: UnlockInput, opts?: JobOptions): Promise<SecurityOutput> {
  return runQpdf({ mode: "unlock", input: input.file, args: unlockArgs(input.password) }, opts);
}

/** Read a page count in a worker, without copying the file on the main thread. */
export async function readPageCount(file: File): Promise<{ pageCount: number | null; encrypted: boolean }> {
  try {
    // Hand the worker the File itself: it reads the bytes on its own thread,
    // so a 100 MB document is not copied on the main thread first.
    const info = await runPdfInfo({ file });
    return { pageCount: info.pageCount || null, encrypted: info.encrypted };
  } catch (e) {
    if (e instanceof EngineError && e.code === "password") return { pageCount: 0, encrypted: true };
    if (e instanceof EngineError && e.code === "oom") return { pageCount: null, encrypted: false };
    throw e;
  }
}
