/**
 * Verify: local hashes, signature structure and a two-file comparison.
 *
 * Signatures are checked structurally: the ByteRange must start at byte 0 and
 * run to EOF, which catches a file changed after it was signed. Certificate
 * chains and PKCS#7 message digests are not validated here; the UI says so.
 */
import { PDFDocument } from "pdf-lib";
import type {
  PdfCompareInput,
  PdfCompareMetadataChange,
  PdfCompareOutput,
  PdfComparePage,
  PdfFileSummary,
  PdfMetadataFields,
  PdfVerifyInput,
  PdfVerifyOutput,
} from "../types";
import { assertNotCancelled, openPdf, readPdfData, resetCancel } from "../worker-shared";
import { hasRawSignature, readFonts, readSignatures } from "./pdf-inspect";
import { readMetadataFields } from "./metadata";
import { scanPdfRisks } from "./pdf-scan";
import { itemsToLines, linesToPlainText, type PdfTextItem } from "./text-extract";

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

async function digest(algorithm: "SHA-1" | "SHA-256" | "SHA-512", buffer: ArrayBuffer): Promise<string> {
  const result = await globalThis.crypto.subtle.digest(algorithm, buffer);
  return toHex(new Uint8Array(result));
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  for (let i = 0; i < a.byteLength; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

async function summarize(
  buffer: ArrayBuffer,
  name: string,
  onProgress?: (p: number, label?: string) => void,
): Promise<PdfFileSummary> {
  const bytes = new Uint8Array(buffer);
  assertNotCancelled();
  onProgress?.(0.1, "Hashing");
  // One copy keeps large files to a single extra buffer; digest never mutates it.
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const [sha256, sha1, sha512] = await Promise.all([
    digest("SHA-256", copy.buffer),
    digest("SHA-1", copy.buffer),
    digest("SHA-512", copy.buffer),
  ]);

  assertNotCancelled();
  onProgress?.(0.45, "Reading metadata");
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });
  const metadata = readMetadataFields(doc);
  const risks = scanPdfRisks(bytes);
  onProgress?.(0.65, "Reading fonts");
  const fonts = readFonts(doc);
  const signatures = readSignatures(doc, bytes.byteLength);
  if (!signatures.length && hasRawSignature(bytes)) {
    signatures.push({
      field: "Signature",
      kind: "signature",
      signed: true,
      subFilter: "",
      byteRange: [],
      coversWholeFile: false,
      modifiedAfterSigning: false,
      signedAt: "",
      name: "",
      reason: "",
      location: "",
    });
  }
  onProgress?.(1, "Verified");
  return {
    name,
    size: bytes.byteLength,
    pageCount: doc.getPageCount(),
    sha256,
    sha1,
    sha512,
    metadata,
    signatures,
    fonts,
    risks,
  };
}

export async function verifyMain(
  input: PdfVerifyInput,
  onProgress?: (p: number, label?: string) => void,
): Promise<PdfVerifyOutput> {
  resetCancel();
  const buffer = await readPdfData(input.file);
  return summarize(buffer, input.name || "PDF", onProgress);
}

async function pageText(doc: Awaited<ReturnType<typeof openPdf>>, page: number): Promise<string> {
  const pdfPage = await doc.getPage(page);
  const content = await pdfPage.getTextContent();
  const items: PdfTextItem[] = content.items
    .filter((item) => typeof (item as { str?: unknown }).str === "string")
    .map((item) => {
      const t = item as unknown as { str: string; transform: number[]; width?: number; height?: number };
      return { str: t.str, transform: t.transform, width: t.width, height: t.height };
    });
  pdfPage.cleanup();
  return linesToPlainText(itemsToLines(items)).replace(/\s+/g, " ").trim();
}

const METADATA_FIELDS: (keyof PdfMetadataFields)[] = [
  "title",
  "author",
  "subject",
  "keywords",
  "creator",
  "producer",
  "creationDate",
  "modificationDate",
];

export async function compareMain(
  input: PdfCompareInput,
  onProgress?: (p: number, label?: string) => void,
): Promise<PdfCompareOutput> {
  resetCancel();
  onProgress?.(0.02, "Reading both files");
  const [bufferA, bufferB] = await Promise.all([readPdfData(input.a), readPdfData(input.b)]);
  assertNotCancelled();
  const bytesA = new Uint8Array(bufferA);
  const bytesB = new Uint8Array(bufferB);
  const identical = equalBytes(bytesA, bytesB);

  onProgress?.(0.08, "Hashing");
  const [a, b] = await Promise.all([
    summarize(bufferA, input.aName || "First PDF", (p, label) => onProgress?.(0.08 + p * 0.27, label)),
    summarize(bufferB, input.bName || "Second PDF", (p, label) => onProgress?.(0.36 + p * 0.27, label)),
  ]);
  assertNotCancelled();

  const metadataChanges: PdfCompareMetadataChange[] = METADATA_FIELDS.filter(
    (field) => a.metadata[field] !== b.metadata[field],
  ).map((field) => ({ field, a: a.metadata[field], b: b.metadata[field] }));

  if (identical) {
    const pages: PdfComparePage[] = Array.from({ length: a.pageCount }, (_, i) => ({ page: i + 1, status: "same" }));
    onProgress?.(1, "Identical");
    return { identical, a, b, pages, metadataChanges };
  }

  onProgress?.(0.64, "Reading page text");
  const docA = await openPdf(bufferA);
  const docB = await openPdf(bufferB);
  const max = Math.max(docA.numPages, docB.numPages);
  const pages: PdfComparePage[] = [];

  for (let page = 1; page <= max; page++) {
    assertNotCancelled();
    if (page > docA.numPages) {
      pages.push({ page, status: "only-b" });
    } else if (page > docB.numPages) {
      pages.push({ page, status: "only-a" });
    } else {
      const [textA, textB] = await Promise.all([pageText(docA, page), pageText(docB, page)]);
      pages.push({ page, status: textA === textB ? "same" : "changed" });
    }
    onProgress?.(0.64 + (page / Math.max(1, max)) * 0.35, `Comparing page ${page}`);
  }

  await docA.destroy();
  await docB.destroy();
  onProgress?.(1, "Compared");
  return { identical, a, b, pages, metadataChanges };
}
