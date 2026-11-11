/** PDF text worker: extract positioned text and offer text or Markdown. */
import type { PdfTextInput, PdfTextOutput } from "../types";
import { assertNotCancelled, exposeJobs, openPdfChecked, resetCancel } from "../worker-shared";
import {
  itemsToLines,
  joinPages,
  linesToMarkdown,
  linesToPlainText,
  type PdfTextItem,
} from "../impl/text-extract";

async function extract(input: PdfTextInput, onProgress: (p: number, label?: string) => void): Promise<PdfTextOutput> {
  resetCancel();
  const doc = await openPdfChecked(input.file);
  const total = doc.numPages;
  const pages = input.pages === "all" ? Array.from({ length: total }, (_, i) => i + 1) : input.pages;
  const parts: string[] = [];

  for (let i = 0; i < pages.length; i++) {
    assertNotCancelled();
    const pageNo = pages[i];
    if (pageNo < 1 || pageNo > total) continue;
    const page = await doc.getPage(pageNo);
    const content = await page.getTextContent();
    const items: PdfTextItem[] = content.items
      .filter((item) => typeof (item as { str?: unknown }).str === "string")
      .map((item) => {
        const t = item as unknown as { str: string; transform: number[]; width?: number; height?: number };
        return { str: t.str, transform: t.transform, width: t.width, height: t.height };
      });
    const lines = itemsToLines(items);
    parts.push(input.format === "markdown" ? linesToMarkdown(lines) : linesToPlainText(lines));
    page.cleanup();
    onProgress?.((i + 1) / pages.length, `Page ${pageNo}`);
  }

  const text = joinPages(parts, input.format);
  const type = input.format === "markdown" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";
  onProgress?.(1, "Done");
  return { blob: new Blob([text], { type }), pages: parts.length, chars: text.length };
}

exposeJobs({
  extract: (input, p) => extract(input as PdfTextInput, p),
});
