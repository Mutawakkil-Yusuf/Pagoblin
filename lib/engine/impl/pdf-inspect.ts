/**
 * Structural PDF inspection shared by the sanitizer and Verify.
 *
 * Everything here reads the document's own dictionaries: fonts referenced by
 * page resources, name-tree attachments, and AcroForm signature fields. It is
 * deliberately not a rendering pass, so it stays fast on large files.
 */
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFString,
} from "pdf-lib";
import type { PdfFontInfo, PdfInspectInput, PdfInspectOutput, PdfSignatureInfo } from "../types";
import { readPdfData, resetCancel } from "../worker-shared";
import { hasPdfName, scanPdfRisks } from "./pdf-scan";
import { readMetadataFields } from "./metadata";

function textOf(value: unknown): string {
  if (value instanceof PDFString || value instanceof PDFHexString || value instanceof PDFName) {
    try {
      return value.decodeText();
    } catch {
      return "";
    }
  }
  return "";
}

function firstText(dict: PDFDict, keys: string[]): string {
  for (const key of keys) {
    const value = dict.lookupMaybe(PDFName.of(key), PDFString) ?? dict.lookupMaybe(PDFName.of(key), PDFHexString);
    if (value) {
      const text = textOf(value);
      if (text) return text;
    }
  }
  return "";
}

function hasFontFile(dict: PDFDict): boolean {
  const descriptor = dict.lookupMaybe(PDFName.of("FontDescriptor"), PDFDict);
  if (!descriptor) return false;
  return (
    descriptor.has(PDFName.of("FontFile")) ||
    descriptor.has(PDFName.of("FontFile2")) ||
    descriptor.has(PDFName.of("FontFile3"))
  );
}

function fontInfo(dict: PDFDict): { name: string; type: string; embedded: boolean; subset: boolean } {
  const rawName = textOf(dict.lookupMaybe(PDFName.of("BaseFont"), PDFName)) || "Unnamed font";
  const type = textOf(dict.lookupMaybe(PDFName.of("Subtype"), PDFName)) || "unknown";
  const subset = /^[A-Z]{6}\+/.test(rawName);
  let embedded = hasFontFile(dict);

  if (!embedded) {
    const descendants = dict.lookupMaybe(PDFName.of("DescendantFonts"), PDFArray);
    if (descendants) {
      for (let i = 0; i < descendants.size(); i++) {
        const descendant = descendants.lookupMaybe(i, PDFDict);
        if (descendant && hasFontFile(descendant)) {
          embedded = true;
          break;
        }
      }
    }
  }

  return { name: rawName.replace(/^[A-Z]{6}\+/, ""), type, embedded, subset };
}

/** Fonts referenced from page resource dictionaries, deduplicated by identity. */
export function readFonts(doc: PDFDocument): PdfFontInfo[] {
  const found = new Map<string, PdfFontInfo>();

  for (let pageIndex = 0; pageIndex < doc.getPageCount(); pageIndex++) {
    const resources = doc.getPage(pageIndex).node.Resources();
    const fonts = resources?.lookupMaybe(PDFName.of("Font"), PDFDict);
    if (!fonts) continue;

    const onThisPage = new Set<string>();
    for (const key of fonts.keys()) {
      const font = fonts.lookupMaybe(key, PDFDict);
      if (!font) continue;
      const info = fontInfo(font);
      const id = `${info.name}|${info.type}|${info.embedded}`;
      if (onThisPage.has(id)) continue;
      onThisPage.add(id);
      const existing = found.get(id);
      if (existing) existing.pages += 1;
      else found.set(id, { ...info, pages: 1 });
    }
  }

  return [...found.values()].sort((a, b) => b.pages - a.pages || a.name.localeCompare(b.name));
}

function collectNameTree(node: PDFDict, out: Set<string>, depth = 0) {
  if (depth > 20) return;
  const names = node.lookupMaybe(PDFName.of("Names"), PDFArray);
  if (names) {
    for (let i = 0; i + 1 < names.size(); i += 2) {
      const key = names.lookupMaybe(i, PDFString) ?? names.lookupMaybe(i, PDFHexString);
      const text = textOf(key);
      if (text) out.add(text);
    }
  }
  const kids = node.lookupMaybe(PDFName.of("Kids"), PDFArray);
  if (kids) {
    for (let i = 0; i < kids.size(); i++) {
      const kid = kids.lookupMaybe(i, PDFDict);
      if (kid) collectNameTree(kid, out, depth + 1);
    }
  }
}

/** Attachment names from the EmbeddedFiles name tree and FileAttachment annotations. */
export function readEmbeddedFileNames(doc: PDFDocument): string[] {
  const out = new Set<string>();

  const names = doc.catalog.lookupMaybe(PDFName.of("Names"), PDFDict);
  const embedded = names?.lookupMaybe(PDFName.of("EmbeddedFiles"), PDFDict);
  if (embedded) collectNameTree(embedded, out);

  for (let pageIndex = 0; pageIndex < doc.getPageCount(); pageIndex++) {
    const annots = doc.getPage(pageIndex).node.Annots();
    if (!annots) continue;
    for (let i = 0; i < annots.size(); i++) {
      const annot = annots.lookupMaybe(i, PDFDict);
      if (!annot) continue;
      const subtype = textOf(annot.lookupMaybe(PDFName.of("Subtype"), PDFName));
      if (subtype !== "FileAttachment") continue;
      const spec = annot.lookupMaybe(PDFName.of("FS"), PDFDict);
      const name = spec ? firstText(spec, ["UF", "F", "Desc"]) : "";
      out.add(name || `Attachment ${out.size + 1}`);
    }
  }

  return [...out].sort((a, b) => a.localeCompare(b));
}

function signatureFromValue(
  field: PDFDict,
  value: PDFDict | undefined,
  size: number,
  fallbackName: string,
): PdfSignatureInfo {
  const fieldName = firstText(field, ["T"]) || fallbackName;
  const byteRangeArray = value?.lookupMaybe(PDFName.of("ByteRange"), PDFArray);
  const byteRange: number[] = [];
  if (byteRangeArray) {
    for (let i = 0; i < byteRangeArray.size(); i++) {
      const number = byteRangeArray.lookupMaybe(i, PDFNumber);
      if (number) byteRange.push(number.asNumber());
    }
  }

  const [start1 = -1, len1 = 0, start2 = -1, len2 = 0] = byteRange;
  const valid = byteRange.length === 4 && start1 === 0 && len1 > 0 && start2 >= len1 && len2 >= 0;
  const end = start2 + len2;
  const coversWholeFile = valid && end === size && len1 + len2 < size;
  const modifiedAfterSigning = valid && end < size;

  let kind: PdfSignatureInfo["kind"] = value ? "signature" : "field";
  const references = value?.lookupMaybe(PDFName.of("Reference"), PDFArray);
  if (references) {
    for (let i = 0; i < references.size(); i++) {
      const reference = references.lookupMaybe(i, PDFDict);
      const method = textOf(reference?.lookupMaybe(PDFName.of("TransformMethod"), PDFName));
      if (method === "DocMDP") {
        kind = "certification";
        break;
      }
    }
  }

  return {
    field: fieldName,
    kind,
    signed: !!value && (byteRange.length > 0 || value.has(PDFName.of("Contents"))),
    subFilter: textOf(value?.lookupMaybe(PDFName.of("SubFilter"), PDFName)),
    byteRange,
    coversWholeFile,
    modifiedAfterSigning,
    signedAt: value ? firstText(value, ["M"]) : "",
    name: value ? firstText(value, ["Name"]) : "",
    reason: value ? firstText(value, ["Reason"]) : "",
    location: value ? firstText(value, ["Location"]) : "",
  };
}

function walkSignatureFields(field: PDFDict, out: PdfSignatureInfo[], size: number, depth = 0) {
  if (depth > 20) return;
  const kids = field.lookupMaybe(PDFName.of("Kids"), PDFArray);
  if (kids) {
    for (let i = 0; i < kids.size(); i++) {
      const kid = kids.lookupMaybe(i, PDFDict);
      if (kid) walkSignatureFields(kid, out, size, depth + 1);
    }
    return;
  }

  const type = textOf(field.lookupMaybe(PDFName.of("FT"), PDFName));
  const value = field.lookupMaybe(PDFName.of("V"), PDFDict);
  if (type !== "Sig" && !value?.has(PDFName.of("ByteRange"))) return;
  out.push(signatureFromValue(field, value, size, `Signature ${out.length + 1}`));
}

/** Digital signature fields, including empty ones, plus a raw fallback. */
export function readSignatures(doc: PDFDocument, size: number): PdfSignatureInfo[] {
  const out: PdfSignatureInfo[] = [];
  const form = doc.catalog.lookupMaybe(PDFName.of("AcroForm"), PDFDict);
  const fields = form?.lookupMaybe(PDFName.of("Fields"), PDFArray);
  if (fields) {
    for (let i = 0; i < fields.size(); i++) {
      const field = fields.lookupMaybe(i, PDFDict);
      if (field) walkSignatureFields(field, out, size);
    }
  }
  return out;
}

export async function inspectPdfMain(
  input: PdfInspectInput,
  onProgress?: (p: number, label?: string) => void,
): Promise<PdfInspectOutput> {
  resetCancel();
  const buffer = await readPdfData(input.file);
  const bytes = new Uint8Array(buffer);
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });
  onProgress?.(0.25, "Reading metadata");
  const metadata = readMetadataFields(doc);
  onProgress?.(0.45, "Reading fonts");
  const fonts = readFonts(doc);
  onProgress?.(0.65, "Reading attachments");
  const embeddedFiles = readEmbeddedFileNames(doc);
  onProgress?.(0.85, "Checking signatures");
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
  const risks = scanPdfRisks(bytes);
  onProgress?.(1, "Inspected");
  return {
    pageCount: doc.getPageCount(),
    size: bytes.byteLength,
    metadata,
    risks,
    fonts,
    embeddedFiles,
    signatures,
  };
}

/** True when the raw bytes carry a signature dictionary even if AcroForm parsing missed it. */
export function hasRawSignature(bytes: Uint8Array): boolean {
  return hasPdfName(bytes, "/ByteRange") && hasPdfName(bytes, "/Contents");
}
