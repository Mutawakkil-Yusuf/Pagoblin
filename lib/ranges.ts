/**
 * Range parser for the Split tool ("Ranges" mode).
 * Grammar: comma separated pages/ranges. "1-3" inclusive, "5" single, "8-" open
 * to the last page, "-3" from the first page. 1-based.
 * Invalid tokens collect inline bez Peer validation messages rather than throwing.
 */

export type RangeToken =
  | { type: "page"; page: number; raw: string }
  | { type: "range"; start: number; end: number; raw: string; open: boolean }
  | { type: "error"; raw: string; message: string };

export type ParseResult = { tokens: RangeToken[]; pages: number[]; ok: boolean };

export function parseRanges(input: string, pageCount: number): ParseResult {
  const tokens: RangeToken[] = [];
  const pagesSet = new Set<number>();

  const rawParts = input
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  for (const raw of rawParts) {
    const err = (message: string): void => {
      tokens.push({ type: "error", raw, message });
    };
    if (/^\d+$/.test(raw)) {
      const page = parseInt(raw, 10);
      if (page < 1 || page > pageCount) {
        err(`Page ${page} does not exist. This file has ${pageCount}.`);
        continue;
      }
      pagesSet.add(page);
      tokens.push({ type: "page", page, raw });
      continue;
    }
    const m = /^(\d*)\s*-\s*(\d*)$/.exec(raw);
    if (!m) {
      err("Use this shape: 1-3, 5, 8-.");
      continue;
    }
    const startStr = m[1];
    const endStr = m[2];
    const start = startStr ? parseInt(startStr, 10) : 1;
    const end = endStr ? parseInt(endStr, 10) : pageCount;
    if (start < 1 || start > pageCount) {
      err(`Page ${start} does not exist. This file has ${pageCount}.`);
      continue;
    }
    if (!endStr && !startStr) {
      err("Use this shape: 1-3, 5, 8-.");
      continue;
    }
    if (end > pageCount) {
      err(`Page ${end} does not exist. This file has ${pageCount}.`);
      continue;
    }
    if (end < start) {
      err("The end page looks smaller than the start page. Swap the numbers.");
      continue;
    }
    const open = !endStr;
    tokens.push({ type: "range", start, end, raw, open });
    for (let p = start; p <= end; p++) pagesSet.add(p);
  }

  const pages = [...pagesSet].sort((a, b) => a - b);
  const ok = tokens.length > 0 && tokens.every((t) => t.type !== "error");
  return { tokens, pages, ok };
}

/** Group parsed sequential pages back into ranges, for display "1, 2, 3, 7-9". */
export function pagesToRanges(pages: number[]): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    if (j - i >= 1) parts.push(`${sorted[i]}-${sorted[j]}`);
    else parts.push(`${sorted[i]}`);
    i = j + 1;
  }
  return parts.join(", ");
}
