/**
 * Text → PDF implementation, node-safe. Type your words, get one A4 document
 * with the standard offline font (WinAnsi-safe: unknown characters are
 * dropped rather than breaking the file).
 */
import { PDFDocument } from "pdf-lib";
import type { TextToPdfInput, TextToPdfOutput } from "../types";
import { assertNotCancelled, resetCancel, u8Part } from "../worker-shared";

/** Wrap text into lines for one Helvetica-ish page (A4). */
function wrappedLinesForPdf(text: string, maxChars: number): string[][] {
  const linesPerPage = Math.floor((841.89 - 2 * 64) / 17.5) - 1;
  const paragraphs = text.replace(/\r\n/g, "\n").split("\n");
  const pages: string[][] = [];
  let current: string[] = [];
  const push = () => {
    pages.push(current);
    current = [];
  };
  const wrap = (line: string) => {
    if (!line) {
      current.push("");
      return;
    }
    for (let start = 0; start < line.length; start += maxChars) {
      let end = Math.min(line.length, start + maxChars);
      if (end < line.length) {
        const space = line.lastIndexOf(" ", end);
        if (space > start) end = space;
      }
      current.push(line.slice(start, end));
      if (current.length >= linesPerPage) push();
    }
  };
  paragraphs.forEach(wrap);
  if (current.length) pages.push(current);
  return pages;
}

export async function textToPdfMain(
  input: TextToPdfInput,
  onProgress?: (p: number, label?: string) => void,
): Promise<TextToPdfOutput> {
  resetCancel();
  const doc = await PDFDocument.create();
  const sanitized = input.text.replace(/[^\x00-\xFF]/g, "");
  const charsPerLine = 84;
  const pages = wrappedLinesForPdf(sanitized, charsPerLine);
  const font = await doc.embedFont("Helvetica");
  for (let p = 0; p < pages.length; p++) {
    assertNotCancelled();
    const page = doc.addPage([595.28, 841.89]);
    let y = page.getHeight() - 72;
    for (const line of pages[p]) {
      page.drawText(line, { x: 64, y, size: 11.5, font });
      y -= 17.5;
    }
    onProgress?.((p + 1) / pages.length, `Page ${p + 1}`);
  }
  const bytes = await doc.save({ useObjectStreams: true });
  onProgress?.(1, "Done");
  return { blob: new Blob([u8Part(bytes)], { type: "application/pdf" }), pages: pages.length };
}
