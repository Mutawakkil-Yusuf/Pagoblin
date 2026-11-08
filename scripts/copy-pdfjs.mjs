// Copies pdf.js runtime assets into public/pdfjs once after install.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url)) + "/..";
const src = join(root, "node_modules/pdfjs-dist");
const dest = join(root, "public/pdfjs");

try {
  mkdirSync(dest, { recursive: true });
  mkdirSync(join(dest, "standard_fonts"), { recursive: true });
  mkdirSync(join(dest, "cmaps"), { recursive: true });
  cpSync(join(src, "build/pdf.worker.min.mjs"), join(dest, "pdf.worker.min.mjs"));
  if (existsSync(join(src, "standard_fonts"))) {
    cpSync(join(src, "standard_fonts"), join(dest, "standard_fonts"), { recursive: true });
  }
  if (existsSync(join(src, "cmaps"))) {
    cpSync(join(src, "cmaps"), join(dest, "cmaps"), { recursive: true });
  }
  console.log("[copy-pdfjs] ok");
} catch (e) {
  console.warn("[copy-pdfjs] skipped:", e.message);
}
