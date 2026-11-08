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

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF

async function looksLikePdf(file: File): Promise<boolean> {
  const head = await file.slice(0, 5).arrayBuffer();
  const bytes = new Uint8Array(head);
  if (bytes.length < 4) return false;
  return PDF_MAGIC.every((b, i) => bytes[i] === b);
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
    const kind = kindOf(file);
    const label = file.name || "file";

    if (file.size === 0) {
      rejects.push({ name: label, reason: fileErrors.empty });
      continue;
    }
    const want = opts.accept.includes(kind);
    if (!want) {
      if (kind === "pdf") rejects.push({ name: label, reason: fileErrors.pdfExpected });
      else if (opts.accept.includes("pdf"))
        rejects.push({ name: label, reason: fileErrors.notPdf });
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
    const finish = () => {
      if (settled) return;
      settled = true;
      const files = Array.from(input.files ?? []);
      input.remove();
      resolve(files);
    };
    input.addEventListener("change", finish);
    // Fallback if change never fires (some Android WebViews on cancel).
    window.addEventListener("focus", finish, { once: true });
    setTimeout(finish, 60_000);
    input.click();
  });
}

/** Popup pages per item via the worker client — small helper used by tools. */
export function oneFileLabel(items: FileItem[]): string | null {
  return items.length === 1 ? items[0].name : null;
}
