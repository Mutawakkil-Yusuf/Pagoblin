/**
 * PDF text layout, node-safe. pdf.js gives positioned text runs; this groups
 * runs into visual lines, keeps reading order, and offers a plain-text or a
 * lightly structured Markdown view. No OCR is involved here.
 */

export type PdfTextItem = {
  str: string;
  transform: number[];
  width?: number;
  height?: number;
};

export type TextLine = { text: string; x: number; y: number; height: number };

export function itemsToLines(items: PdfTextItem[]): TextLine[] {
  const runs = items
    .filter((it) => typeof it.str === "string" && it.str.length > 0)
    .map((it) => {
      const t = it.transform ?? [1, 0, 0, 1, 0, 0];
      const height = Math.max(1, it.height ?? Math.hypot(t[1] ?? 0, t[3] ?? 0) ?? 10);
      return { text: it.str, x: t[4] ?? 0, y: t[5] ?? 0, width: it.width ?? 0, height };
    })
    .sort((a, b) => (Math.abs(a.y - b.y) > 1 ? b.y - a.y : a.x - b.x));

  const lines: { y: number; height: number; runs: typeof runs }[] = [];
  for (const run of runs) {
    const tolerance = Math.max(1.5, run.height * 0.35);
    let line = lines.find((l) => Math.abs(l.y - run.y) <= tolerance);
    if (!line) {
      line = { y: run.y, height: run.height, runs: [] };
      lines.push(line);
    }
    line.runs.push(run);
    line.height = Math.max(line.height, run.height);
  }

  return lines
    .sort((a, b) => b.y - a.y)
    .map((line) => {
      const sorted = line.runs.sort((a, b) => a.x - b.x);
      let text = "";
      let end = -Infinity;
      for (const run of sorted) {
        const gap = run.x - end;
        const needsSpace =
          text.length > 0 &&
          !/\s$/.test(text) &&
          !/^\s/.test(run.text) &&
          gap > Math.max(1.5, run.height * 0.18);
        if (needsSpace) text += " ";
        text += run.text;
        end = run.x + (run.width || 0);
      }
      return { text: text.replace(/\s+/g, " ").trim(), x: sorted[0]?.x ?? 0, y: line.y, height: line.height };
    })
    .filter((line) => line.text.length > 0);
}

export function linesToPlainText(lines: TextLine[]): string {
  return lines
    .map((line) => line.text)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function medianHeight(lines: TextLine[]): number {
  const heights = lines.map((l) => l.height).sort((a, b) => a - b);
  if (!heights.length) return 10;
  return heights[Math.floor(heights.length / 2)] || 10;
}

export function linesToMarkdown(lines: TextLine[]): string {
  const body = medianHeight(lines);
  const out: string[] = [];
  let previous: TextLine | null = null;

  for (const line of lines) {
    let text = line.text;
    const isBullet = /^[•●▪◦‣·]\s*/.test(text);
    if (isBullet) text = `- ${text.replace(/^[•●▪◦‣·]\s*/, "")}`;

    const ratio = line.height / body;
    let prefix = "";
    if (!isBullet && ratio >= 1.45) prefix = "# ";
    else if (!isBullet && ratio >= 1.18) prefix = "## ";

    if (previous) {
      const gap = previous.y - line.y;
      const bigGap = gap > Math.max(previous.height, line.height) * 1.75;
      if (bigGap || prefix) out.push("");
    }
    out.push(`${prefix}${text}`);
    previous = line;
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Join extracted pages with a readable blank line (no page furniture). */
export function joinPages(pages: string[], format: "text" | "markdown"): string {
  const clean = pages.map((p) => p.trim()).filter(Boolean);
  if (format === "markdown") return clean.join("\n\n");
  return clean.join("\n\n");
}
