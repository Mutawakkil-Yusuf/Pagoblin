/** Formatting helpers. */

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes === 0) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1) return `${Math.round(bytes)} B`;
  if (kb < 1024) return kb < 10 ? `${kb.toFixed(1).replace(/\.0$/, "")} KB` : `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return mb < 10 ? `${mb.toFixed(1).replace(/\.0$/, "")} MB` : `${Math.round(mb)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1).replace(/\.0$/, "")} GB`;
}

export function parseTargetSize(input: string): number {
  // Handles "1", "1.5MB", "2 MB", "800 KB", "1 000 000"
  const s = input.trim().toLowerCase().replace(/[,\s]/g, "");
  const m = /^([0-9]*\.?[0-9]+)(kb|k|mb|m|b)?$/.exec(s);
  if (!m) return NaN;
  const n = parseFloat(m[1]);
  switch (m[2]) {
    case "kb":
    case "k":
      return n * 1024;
    case "mb":
    case "m":
      return n * 1024 * 1024;
    case "b":
      return n;
    default:
      // Bare number with no unit means MB, the everyday case.
      return n * 1024 * 1024;
  }
}

/** Truncate in the middle so extensions stay visible: "Job applica….12 of 40.pdf" -> "Job app…40.pdf" + .pdf */
export function elideName(name: string, max = 32): string {
  if (name.length <= max) return name;
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot) : "";
  const base = dot > 0 ? name.slice(0, dot) : name;
  const room = Math.max(4, max - ext.length - 1);
  return `${base.slice(0, Math.ceil(room / 2))}…${base.slice(-Math.floor(room / 2))}${ext}`;
}

/** Turn a user-supplied stem into a safe filename stem (keeps extension separate). */
export function safeStem(stem: string): string {
  return (
    stem
      .replace(/[;'"`:?%<>|\\/$()*+[\]{}]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60) || "file"
  );
}

export function pluralPages(n: number): string {
  return `${n} ${n === 1 ? "page" : "pages"}`;
}

export function percentSaved(before: number, after: number): number {
  if (!before) return 0;
  const p = Math.round(((before - after) / before) * 100);
  return Math.max(0, p);
}
