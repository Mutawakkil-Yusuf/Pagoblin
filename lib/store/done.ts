"use client";

import { create } from "zustand";

export type DoneToolKey =
  | "merge"
  | "split"
  | "compress"
  | "convert"
  | "sign"
  | "flow"
  | "pdf-to-image"
  | "image-to-pdf"
  | "text-to-pdf"
  | "organize"
  | "protect"
  | "unlock"
  | "metadata"
  | "sanitize"
  | "pdf-to-text"
  | "pdf-to-markdown"
  | "redact"
  | "form"
  | "ocr"
  | "batch";

export type DoneBlob = { blob: Blob; name: string; kind?: string; size?: number };

export type BeforeAfter = { before?: number; after?: number; pages?: number; count?: number };

export type DoneResult = {
  id: string;
  tool: DoneToolKey;
  /** Short headline, e.g. "All squeezed!" or "Merged!" */
  headline: string;
  /** Result sentence inserting real names and numbers. */
  sentence: string;
  beforeAfter: BeforeAfter;
  outputs: DoneBlob[];
  /** Whether the result is a zip (multiple outputs). */
  zipped?: boolean;
  at: number;
};

type DoneStore = {
  result: DoneResult | null;
  installCardReady: boolean;
  setResult: (r: DoneResult) => void;
  clear: () => void;
};

export const useDoneStore = create<DoneStore>()((set) => ({
  result: null,
  installCardReady: false,
  setResult: (r) => set({ result: r, installCardReady: true }),
  clear: () => set({ result: null, installCardReady: false }),
}));

export const defaultHeadline = (tool: DoneToolKey, meta?: { reached?: boolean }): string => {
  switch (tool) {
    case "merge":
      return "Merged!";
    case "split":
      return "Split!";
    case "compress":
      return meta?.reached === false ? "Squeezed!" : "All squeezed!";
    case "convert":
    case "pdf-to-image":
      return "Converted!";
    case "image-to-pdf":
      return "Made your PDF!";
    case "text-to-pdf":
      return "Made your PDF!";
    case "sign":
      return "Signed!";
    case "flow":
      return "Flow done!";
    case "organize":
      return "Organized!";
    case "protect":
      return "Locked!";
    case "unlock":
      return "Unlocked!";
    case "metadata":
      return "Metadata saved!";
    case "sanitize":
      return "Cleaned!";
    case "pdf-to-text":
      return "Text out!";
    case "pdf-to-markdown":
      return "Markdown out!";
    case "redact":
      return "Redacted!";
    case "form":
      return "Form filled!";
    case "ocr":
      return "Read!";
    case "batch":
      return "Batch done!";
    default:
      return "Done!";
  }
};
