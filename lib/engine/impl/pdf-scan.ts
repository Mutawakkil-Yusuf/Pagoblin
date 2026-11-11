/**
 * Cheap structural scan over raw PDF bytes. It never decodes the whole file to
 * a string: a 100 MB PDF stays one 100 MB buffer, and the scan is a single pass
 * over the bytes. Results are hints, not a parser and not a virus scan.
 */
import type { PdfRiskReport } from "../types";

const SLASH = 0x2f;

/** PDF name delimiter bytes (PDF 32000-1 §7.2.2). */
function isNameDelimiter(byte: number | undefined): boolean {
  if (byte === undefined) return true;
  return (
    byte === 0x00 ||
    byte === 0x09 ||
    byte === 0x0a ||
    byte === 0x0c ||
    byte === 0x0d ||
    byte === 0x20 ||
    byte === 0x25 || // %
    byte === 0x28 || // (
    byte === 0x29 || // )
    byte === 0x2f || // /
    byte === 0x3c || // <
    byte === 0x3e || // >
    byte === 0x5b || // [
    byte === 0x5d || // ]
    byte === 0x7b || // {
    byte === 0x7d // }
  );
}

function ascii(name: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < name.length; i++) out.push(name.charCodeAt(i) & 0xff);
  return out;
}

function matchesAt(bytes: Uint8Array, at: number, needle: number[]): boolean {
  if (at + needle.length > bytes.length) return false;
  for (let i = 0; i < needle.length; i++) {
    if (bytes[at + i] !== needle[i]) return false;
  }
  return true;
}

type CountKey = "javascript" | "embeddedFiles" | "openAction" | "launch" | "uri" | "annotations";
type FlagKey = "xmp" | "acroForm" | "xfa";

const COUNT_NEEDLES: { key: CountKey; names: string[] }[] = [
  { key: "javascript", names: ["/JavaScript", "/JS"] },
  { key: "embeddedFiles", names: ["/EmbeddedFiles", "/Filespec"] },
  { key: "openAction", names: ["/OpenAction"] },
  { key: "launch", names: ["/Launch"] },
  { key: "uri", names: ["/URI"] },
  { key: "annotations", names: ["/Annots"] },
];

const FLAG_NEEDLES: { key: FlagKey; names: string[] }[] = [
  { key: "xmp", names: ["/Metadata"] },
  { key: "acroForm", names: ["/AcroForm"] },
  { key: "xfa", names: ["/XFA"] },
];

const COUNT_PATTERNS = COUNT_NEEDLES.map((entry) => ({
  key: entry.key,
  needles: entry.names.map(ascii),
}));
const FLAG_PATTERNS = FLAG_NEEDLES.map((entry) => ({
  key: entry.key,
  needles: entry.names.map(ascii),
}));

export function hasPdfName(bytes: Uint8Array, name: string): boolean {
  const needle = ascii(name);
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] !== SLASH) continue;
    if (matchesAt(bytes, i, needle) && isNameDelimiter(bytes[i + needle.length])) return true;
  }
  return false;
}

export function scanPdfRisks(bytes: Uint8Array): PdfRiskReport {
  const counts: Record<CountKey, number> = {
    javascript: 0,
    embeddedFiles: 0,
    openAction: 0,
    launch: 0,
    uri: 0,
    annotations: 0,
  };
  const flags: Record<FlagKey, boolean> = { xmp: false, acroForm: false, xfa: false };

  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] !== SLASH) continue;

    for (const pattern of COUNT_PATTERNS) {
      for (const needle of pattern.needles) {
        if (matchesAt(bytes, i, needle) && isNameDelimiter(bytes[i + needle.length])) {
          counts[pattern.key] += 1;
        }
      }
    }
    for (const pattern of FLAG_PATTERNS) {
      if (flags[pattern.key]) continue;
      for (const needle of pattern.needles) {
        if (matchesAt(bytes, i, needle) && isNameDelimiter(bytes[i + needle.length])) {
          flags[pattern.key] = true;
        }
      }
    }
  }

  return { ...counts, ...flags };
}
