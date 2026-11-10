/**
 * CompressEngine interface. Engine A (Ghostscript WASM) and Engine B
 * (pdf.js render + JPEG re-encode, "Flatten") both implement this; the UI and
 * the compress worker are engine-agnostic so the licence choice can change.
 */

export type AttemptResult = { size: number; bytes: Uint8Array | null };

export type CompressEngine = {
  id: "gs" | "flatten";
  label: string;
  availability(): Promise<boolean>;
  /**
   * One compression attempt at a given render density.
   * `signalCheck` lets the engine bail between internal chunks.
   */
  attempt(
    inputBytes: ArrayBuffer,
    fileName: string,
    dpi: number,
    signalCheck?: () => void,
    /** Optional live page progress inside one attempt (Ghostscript reports it). */
    onPage?: (page: number, total: number) => void,
  ): Promise<AttemptResult>;
};
