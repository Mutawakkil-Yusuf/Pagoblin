/** Copy the qpdf WASM CLI out of node_modules into public/qpdf (gitignored). */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const from = join("node_modules", "@jspawn", "qpdf-wasm");
const to = join("public", "qpdf");
const files = ["qpdf.js", "qpdf.wasm"];

if (!existsSync(join(from, files[0]))) {
  console.warn("[copy-qpdf] @jspawn/qpdf-wasm is not installed; skipping.");
  process.exit(0);
}

mkdirSync(to, { recursive: true });
for (const file of files) {
  mkdirSync(dirname(join(to, file)), { recursive: true });
  copyFileSync(join(from, file), join(to, file));
}
console.log(`[copy-qpdf] copied ${files.join(", ")} to ${to}`);
