/**
 * WinAnsi-safe text for pdf-lib's standard fonts. The standard 14 fonts only
 * encode CP1252, so typographic punctuation is folded to its ASCII equivalent
 * and characters the font cannot show are dropped instead of breaking a save.
 */
const PUNCT: Record<string, string> = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201A": "'",
  "\u201B": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u201E": '"',
  "\u201F": '"',
  "\u2013": "-",
  "\u2014": "-",
  "\u2026": "...",
  "\u00A0": " ",
  "\u2022": "\u2022",
  "\u20AC": "\u20AC",
  "\u2122": "\u2122",
};

function encodable(code: number): boolean {
  return (
    (code >= 0x20 && code <= 0x7e) ||
    (code >= 0xa0 && code <= 0xff) ||
    code === 0x2022 || // bullet
    code === 0x20ac || // euro
    code === 0x2122 // trademark
  );
}

/**
 * Fold text to characters pdf-lib can encode with a standard font.
 * `keepWhitespace` preserves line breaks and tabs (used for text → PDF);
 * otherwise the result is trimmed (used for OCR word overlays).
 */
export function toWinAnsi(text: string, opts?: { keepWhitespace?: boolean }): string {
  let out = "";
  for (const ch of text) {
    const mapped = PUNCT[ch] ?? ch;
    for (const c of mapped) {
      const code = c.codePointAt(0) ?? 0;
      if (opts?.keepWhitespace && (code === 0x0a || code === 0x0d || code === 0x09)) {
        out += c;
        continue;
      }
      if (encodable(code)) out += c;
    }
  }
  return opts?.keepWhitespace ? out : out.trim();
}
