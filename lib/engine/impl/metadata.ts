/**
 * Metadata inspector / editor / sanitizer, node-safe.
 *
 * The sanitizer rebuilds the document page by page into a fresh PDF and drops
 * document-level actions, attachments, forms, outlines and XMP metadata. Page
 * annotations (including link actions) are removed from the copied pages too.
 * It is deliberately conservative: content streams are copied unchanged.
 */
import { PDFDocument, PDFName } from "pdf-lib";
import type {
  PdfMetadataFields,
  PdfMetadataInput,
  PdfMetadataOutput,
  PdfMetadataWriteInput,
  PdfMetadataWriteOutput,
  PdfSanitizeInput,
  PdfSanitizeOutput,
} from "../types";
import { assertNotCancelled, readPdfData, resetCancel, u8Part } from "../worker-shared";
import { scanPdfRisks } from "./pdf-scan";

export { scanPdfRisks } from "./pdf-scan";

function iso(date: Date | undefined): string {
  try {
    return date ? date.toISOString() : "";
  } catch {
    return "";
  }
}

function readFields(doc: PDFDocument): PdfMetadataFields {
  const safe = (fn: () => string | undefined, fallback = ""): string => {
    try {
      return fn() ?? fallback;
    } catch {
      return fallback;
    }
  };
  return {
    title: safe(() => doc.getTitle(), ""),
    author: safe(() => doc.getAuthor(), ""),
    subject: safe(() => doc.getSubject(), ""),
    keywords: safe(() => doc.getKeywords(), ""),
    creator: safe(() => doc.getCreator(), ""),
    producer: safe(() => doc.getProducer(), ""),
    creationDate: safe(() => iso(doc.getCreationDate()), ""),
    modificationDate: safe(() => iso(doc.getModificationDate()), ""),
  };
}

export async function readMetadataMain(
  input: PdfMetadataInput,
  onProgress?: (p: number, label?: string) => void,
): Promise<PdfMetadataOutput> {
  resetCancel();
  const file = await readPdfData(input.file);
  const bytes = new Uint8Array(file);
  const doc = await PDFDocument.load(file, { ignoreEncryption: false });
  onProgress?.(1, "Read");
  return {
    pageCount: doc.getPageCount(),
    size: bytes.byteLength,
    metadata: readFields(doc),
    risks: scanPdfRisks(bytes),
  };
}

function applyFields(doc: PDFDocument, fields: Partial<PdfMetadataFields>) {
  if (fields.title !== undefined) doc.setTitle(fields.title);
  if (fields.author !== undefined) doc.setAuthor(fields.author);
  if (fields.subject !== undefined) doc.setSubject(fields.subject);
  // pdf-lib joins an array with spaces; one element keeps the typed commas.
  if (fields.keywords !== undefined) doc.setKeywords(fields.keywords ? [fields.keywords] : []);
  if (fields.creator !== undefined) doc.setCreator(fields.creator);
  if (fields.producer !== undefined) doc.setProducer(fields.producer);
  if (fields.creationDate) {
    const date = new Date(fields.creationDate);
    if (!Number.isNaN(date.getTime())) doc.setCreationDate(date);
  }
  if (fields.modificationDate) {
    const date = new Date(fields.modificationDate);
    if (!Number.isNaN(date.getTime())) doc.setModificationDate(date);
  }
}

export async function writeMetadataMain(
  input: PdfMetadataWriteInput,
  onProgress?: (p: number, label?: string) => void,
): Promise<PdfMetadataWriteOutput> {
  resetCancel();
  const file = await readPdfData(input.file);
  const doc = await PDFDocument.load(file, { ignoreEncryption: false });
  assertNotCancelled();
  applyFields(doc, input.metadata);
  const bytes = await doc.save({ useObjectStreams: true });
  onProgress?.(1, "Saved");
  return {
    blob: new Blob([u8Part(bytes)], { type: "application/pdf" }),
    metadata: readFields(doc),
  };
}

export async function sanitizeMain(
  input: PdfSanitizeInput,
  onProgress?: (p: number, label?: string) => void,
): Promise<PdfSanitizeOutput> {
  resetCancel();
  const file = await readPdfData(input.file);
  const originalBytes = new Uint8Array(file);
  const removed = scanPdfRisks(originalBytes);
  const src = await PDFDocument.load(file, { ignoreEncryption: false });
  const out = await PDFDocument.create();
  const indices = src.getPageIndices();
  const pages = await out.copyPages(src, indices);
  for (let i = 0; i < pages.length; i++) {
    assertNotCancelled();
    pages[i].node.delete(PDFName.of("Annots"));
    pages[i].node.delete(PDFName.of("Metadata"));
    out.addPage(pages[i]);
    onProgress?.((i + 1) / Math.max(1, pages.length), `Cleaning page ${i + 1}`);
  }

  // Document-level things that can carry scripts, attachments or stale identity.
  for (const key of ["OpenAction", "AA", "Names", "AcroForm", "Metadata", "Outlines", "StructTreeRoot", "MarkInfo"]) {
    out.catalog.delete(PDFName.of(key));
  }
  out.setTitle("");
  out.setAuthor("");
  out.setSubject("");
  out.setKeywords([]);
  out.setCreator("Pagoblin");
  out.setProducer("Pagoblin sanitizer");
  out.setCreationDate(new Date());
  out.setModificationDate(new Date());

  const bytes = await out.save({ useObjectStreams: true });
  onProgress?.(1, "Clean");
  return {
    blob: new Blob([u8Part(bytes)], { type: "application/pdf" }),
    before: originalBytes.byteLength,
    after: bytes.byteLength,
    removed,
  };
}
