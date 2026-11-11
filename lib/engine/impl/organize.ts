/**
 * Page organizer core, node-safe. The UI sends an explicit ordered list of
 * page references; this rebuilds a fresh PDF in that order. Duplicates are
 * allowed, rotations are relative to the source page, and pages from inserted
 * PDFs use their own `source` index.
 */
import { PDFDocument, degrees } from "pdf-lib";
import type { OrganizeInput, OrganizeOutput } from "../types";
import { assertNotCancelled, readPdfData, resetCancel, u8Part } from "../worker-shared";

export async function organizeMain(
  input: OrganizeInput,
  onProgress?: (p: number, label?: string) => void,
): Promise<OrganizeOutput> {
  resetCancel();
  if (!input.pages.length) throw new Error("Choose at least one page.");
  if (!input.sources.length) throw new Error("No source PDF.");

  const sources: PDFDocument[] = [];
  for (const source of input.sources) {
    const bytes = await readPdfData(source);
    sources.push(await PDFDocument.load(bytes, { ignoreEncryption: false }));
  }

  const out = await PDFDocument.create();
  const total = input.pages.length;
  for (let i = 0; i < total; i++) {
    assertNotCancelled();
    const item = input.pages[i];
    const source = sources[item.source];
    if (!source) throw new Error("A source PDF is missing.");
    if (item.page < 1 || item.page > source.getPageCount()) {
      throw new Error(`Page ${item.page} is outside that PDF.`);
    }
    const [copied] = await out.copyPages(source, [item.page - 1]);
    if (!copied) throw new Error("A page could not be copied.");
    out.addPage(copied);
    if (item.rotation) {
      copied.setRotation(degrees((copied.getRotation().angle + item.rotation + 360) % 360));
    }
    onProgress?.((i + 1) / total, `Page ${i + 1} of ${total}`);
  }

  const bytes = await out.save({ useObjectStreams: true });
  onProgress?.(1, "Done");
  return { blob: new Blob([u8Part(bytes)], { type: "application/pdf" }), pages: out.getPageCount() };
}
