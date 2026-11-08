/**
 * Engine job contracts. Heavy work lives in per-job-type Web Workers
 * (wrapped with comlink). The main thread never blocks.
 */

export type FilePayload = { name: string; bytes: ArrayBuffer | null; ref: FileRef | null };

/** Transferrable reference to a File object (structured clone keeps File). */
export type FileRef = { file: File };

export type Progress = (p: number, label?: string) => void;

export type MergeInput = {
  files: { name: string; buffer: ArrayBuffer }[];
};
export type MergeOutput = { blob: Blob; pages: number };

export type SplitMode = "pick" | "every" | "ranges";
export type SplitInput =
  | { mode: "pick"; file: ArrayBuffer; pages: number[]; pageCount: number }
  | { mode: "every"; file: ArrayBuffer; pageCount: number }
  | { mode: "ranges"; file: ArrayBuffer; ranges: { start: number; end: number }[] };

export type SplitOutput = { blobs: { blob: Blob; name: string }[]; count: number };

export type RotateStep = { rotateBy: 90 | 180 | 270; pages: number[] | "all" };
export type RotateInput = { file: ArrayBuffer; steps: RotateStep[] };
export type RotateOutput = { blob: Blob };

export type RenameInput = { blobs: { blob: Blob; name: string }[]; stem: string };
export type RenameOutput = { blobs: { blob: Blob; name: string }[] };

export type CompressInput = {
  file: ArrayBuffer;
  fileName: string;
  target?: number | null; // bytes; null = squeeze as small as possible
  engine: "auto" | "flatten";
};
export type CompressOutput = {
  blob: Blob;
  before: number;
  after: number;
  engineUsed: "gs" | "flatten";
  attempts: { dpi: number; size: number }[];
  reached: boolean;
};

export type PdfToImageInput = {
  file: ArrayBuffer;
  format: "png" | "jpg" | "webp";
  quality: number; // 0..1
  scale: number; // dpi/72 multiplier derived from quality
  pages: number[] | "all";
};
export type PdfToImageOutput = { blobs: { blob: Blob; name: string }[] };

export type ImageToPdfInput = {
  images: { name: string; buffer: ArrayBuffer; type: string }[];
  pageSize: "fit" | "a4";
  margin: number; // 0..08 fraction each side (fit) or mm (a4 -> converted)
};
export type ImageToPdfOutput = { blob: Blob };

export type TextToPdfInput = { text: string; title?: string };
export type TextToPdfOutput = { blob: Blob; pages: number };

export type PdfInfoInput = { file: ArrayBuffer };
export type PdfInfoOutput = { pageCount: number; encrypted: boolean };

export type PdfInfoRangeInput = { file: ArrayBuffer; pages: number[]; width: number };
export type Thumb = { page: number; blobUrl?: string; blob: Blob };

export type SignPlaceInput = {
  file: ArrayBuffer;
  signaturePng: ArrayBuffer; // RGBA PNG bytes
  placements: {
    pageIndex: number;
    // Fraction of the page (top-left origin) — the worker converts to
    // PDF user units (bottom-left origin) using the real page size.
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }[];
};
export type SignPlaceOutput = { blob: Blob };

export type FlowStepConfig =
  | { type: "merge" }
  | { type: "compress"; target: number | null }
  | { type: "rotate"; steps: RotateStep[] }
  | { type: "rename"; stem: string };

/* ---------- thumbnail job ---------- */
export type ThumbsInput = { file: ArrayBuffer | File; pages: number[]; width: number };
export type ThumbsOutput = { page: number; blob: Blob }[];
