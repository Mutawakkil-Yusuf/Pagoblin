/**
 * Redaction geometry, node-safe. Redaction itself renders the page, paints the
 * chosen boxes onto the pixels, and rebuilds a fresh PDF from those images, so
 * the text underneath is not present in the output at all.
 */
import type { RedactBox } from "../types";

export type PixelBox = { x: number; y: number; w: number; h: number };

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export function normalizeBox(box: Pick<RedactBox, "x" | "y" | "w" | "h">): Pick<RedactBox, "x" | "y" | "w" | "h"> {
  const x = Math.max(0, Math.min(1, Math.min(box.x, box.x + box.w)));
  const y = Math.max(0, Math.min(1, Math.min(box.y, box.y + box.h)));
  const right = Math.max(0, Math.min(1, Math.max(box.x, box.x + box.w)));
  const bottom = Math.max(0, Math.min(1, Math.max(box.y, box.y + box.h)));
  return { x: round(x), y: round(y), w: round(right - x), h: round(bottom - y) };
}

export function boxToPixels(
  box: Pick<RedactBox, "x" | "y" | "w" | "h">,
  width: number,
  height: number,
): PixelBox {
  const n = normalizeBox(box);
  return {
    x: Math.round(n.x * width),
    y: Math.round(n.y * height),
    w: Math.max(1, Math.round(n.w * width)),
    h: Math.max(1, Math.round(n.h * height)),
  };
}
