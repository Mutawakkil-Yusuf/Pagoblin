/**
 * Shared file handling: FileItems, validation, calm error mapping, size warnings.
 * Files never leave the device; everything here is local.
 */

export type FileKind = "pdf" | "image" | "text" | "other";

export type FileItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  kind: FileKind;
  pageCount?: number;
};

export type Reject = { name: string; reason: string };

export type AddFilesResult = {
  items: FileItem[];
  rejects: Reject[];
  /** Calm warning for big files, shown in a toast. Null when fine. */
  warning: string | null;
};

let counter = 0;
export function nextId(prefix = "f"): string {
  counter += 1;
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}${counter}`;
}

export function isPhoneViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches || (+window.screen.width < 768 && window.screen.width >= window.screen.height);
}

export function kindOf(file: File): FileKind {
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (type.startsWith("image/") || /\.(png|jpe?g|webp|gif|heic|heif)$/.test(name)) return "image";
  if (type.startsWith("text/") || /\.(txt|md|csv)$/.test(name)) return "text";
  return "other";
}

/** Read the first kilobyte once, for both kind sniffing and PDF validation. */
const HEAD_BYTES = 1024;

async function readHead(file: File): Promise<Uint8Array | null> {
  try {
    return new Uint8Array(await file.slice(0, HEAD_BYTES).arrayBuffer());
  } catch {
    return null;
  }
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  let out = "";
  for (let i = start; i < start + length && i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

/**
 * The PDF spec allows the `%PDF-` header anywhere in the first 1024 bytes
 * (some generators prepend junk). Checking only byte 0 rejected real files.
 */
function hasPdfHeader(bytes: Uint8Array): boolean {
  const limit = Math.min(bytes.length, HEAD_BYTES) - 4;
  for (let i = 0; i <= limit; i++) {
    if (bytes[i] === 0x25 && bytes[i + 1] === 0x50 && bytes[i + 2] === 0x44 && bytes[i + 3] === 0x46) return true;
  }
  return false;
}

/** Guess a kind from the file's own bytes, for providers that send no MIME type. */
function kindFromBytes(bytes: Uint8Array): FileKind | null {
  if (!bytes.length) return null;
  if (hasPdfHeader(bytes)) return "pdf";
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG") return "image";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image";
  if (ascii(bytes, 0, 4) === "GIF8") return "image";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "image";
  if (ascii(bytes, 4, 4) === "ftyp" && /^(heic|heix|hevc|heim|heis|hevm|hevs|mif1|msf1|avif)$/.test(ascii(bytes, 8, 4))) {
    return "image";
  }
  // Plain text: no NULs and almost no control characters in the sample.
  const sample = bytes.subarray(0, Math.min(bytes.length, 512));
  let controls = 0;
  for (const b of sample) {
    if (b === 0) return null;
    if (b < 0x09 || (b > 0x0d && b < 0x20)) controls += 1;
  }
  if (controls / sample.length < 0.02) return "text";
  return null;
}

async function looksLikePdf(file: File): Promise<boolean> {
  const bytes = await readHead(file);
  // A provider that cannot hand over bytes yet is not proof of a bad file;
  // let the worker try rather than rejecting a real PDF here.
  if (!bytes || !bytes.length) return true;
  return hasPdfHeader(bytes);
}

/** Size warning thresholds: 50 MB on phones, 100 MB on desktop. */
export function bigFileWarning(file: File): string | null {
  const limit = isPhoneViewport() ? 50 * 1024 * 1024 : 100 * 1024 * 1024;
  if (file.size > limit) {
    return "That is a big one. Pip may be slow.";
  }
  return null;
}

export async function checkItemsForPasswordOrCorruption(
  files: { name: string; file: File }[],
): Promise<Reject[]> {
  const rejects: Reject[] = [];
  for (const f of files) {
    try {
      const ok = await looksLikePdf(f.file);
      if (!ok) {
        rejects.push({ name: f.name, reason: "readPdf" });
      }
    } catch {
      rejects.push({ name: f.name, reason: "unopenable" });
    }
  }
  return rejects;
}

export const fileErrors = {
  empty: "That file is empty. Try another one.",
  notPdf: "Pip only chews PDFs. Drop a PDF to start.",
  imageExpected: "Drop an image to start. JPG, PNG or WebP.",
  pdfExpected: "Drop a PDF to start.",
  unopenable: "Pip could not open that file. Try a smaller one.",
  password: "That PDF has a password. Unlock it first, then drop it here.",
  tooBig: "That file is too big for this device. Try a smaller one.",
  reload: "Pagoblin updated in the background. Reload the page to keep going.",
  generic: "Something went wrong. Try again.",
} as const;

/**
 * Classify dropped/selected files for a tool. Renders calm rejections so the UI can show them.
 * acceptedKinds controls what this tool accepts ("pdf" tools reject images, and vice versa).
 */
export async function makeFileItems(
  files: File[],
  opts: { accept: FileKind[]; toolLabel: string; expectPdf?: boolean },
): Promise<AddFilesResult> {
  const items: FileItem[] = [];
  const rejects: Reject[] = [];
  const warnings: string[] = [];

  for (const file of files) {
    let kind = kindOf(file);
    const label = file.name || "file";

    if (file.size === 0) {
      rejects.push({ name: label, reason: fileErrors.empty });
      continue;
    }
    // Some Android/cloud providers hand over a blank MIME type and a name
    // without an extension. The bytes themselves still say what the file is.
    if (kind === "other") {
      const head = await readHead(file);
      const sniffed = head ? kindFromBytes(head) : null;
      if (sniffed) kind = sniffed;
    }
    const want = opts.accept.includes(kind);
    if (!want) {
      if (opts.accept.includes("pdf")) rejects.push({ name: label, reason: fileErrors.notPdf });
      else if (opts.accept.includes("image")) rejects.push({ name: label, reason: fileErrors.imageExpected });
      else rejects.push({ name: label, reason: fileErrors.pdfExpected });
      continue;
    }
    if (kind === "pdf") {
      const ok = await looksLikePdf(file);
      if (!ok) {
        rejects.push({ name: label, reason: fileErrors.unopenable });
        continue;
      }
    }
    items.push({ id: nextId(), file, name: label, size: file.size, kind });
    const warn = bigFileWarning(file);
    if (warn) warnings.push(warn);
  }

  const warning = warnings.length ? warnings[0] : null;
  return { items, rejects, warning };
}

/** Collect files from a DragEvent or paste ClipboardEvent. */
export function filesFromTransfer(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  const out: File[] = [];
  if (dt.items && dt.items.length) {
    for (const item of Array.from(dt.items)) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) out.push(f);
      }
    }
  }
  if (!out.length && dt.files) {
    out.push(...Array.from(dt.files));
  }
  return out;
}

/** Open the file picker. Caller decides accept and multiple. */
export function pickFiles(opts: { accept?: string; multiple: boolean }): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    if (opts.accept) input.accept = opts.accept;
    input.multiple = opts.multiple;
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    document.body.appendChild(input);
    let settled = false;
    let blurred = false;
    let focusTimer = 0;
    const finish = () => {
      if (settled) return;
      settled = true;
      const files = Array.from(input.files ?? []);
      window.clearTimeout(focusTimer);
      window.clearTimeout(deadline);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      input.remove();
      resolve(files);
    };
    const onBlur = () => {
      blurred = true;
    };
    // Only treat focus as "the picker closed" when the page was blurred first.
    // Some Android builds fire focus as the picker OPENS; finishing then would
    // remove the input and silently lose the choice.
    const onFocus = () => {
      if (!blurred) return;
      window.clearTimeout(focusTimer);
      focusTimer = window.setTimeout(finish, 1200);
    };
    const deadline = window.setTimeout(finish, 60_000);
    input.addEventListener("change", finish);
    input.addEventListener("cancel", finish);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    input.click();
  });
}

/** Popup pages per item via the worker client — small helper used by tools. */
export function oneFileLabel(items: FileItem[]): string | null {
  return items.length === 1 ? items[0].name : null;
}
