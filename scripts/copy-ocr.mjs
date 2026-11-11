/**
 * Copy the local OCR engine out of node_modules into public/ocr (gitignored).
 * Everything is served from this origin, so OCR never calls a CDN.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const out = join(root, "public", "ocr");
const langOut = join(out, "lang");
const coreOut = join(out, "core");

const copies = [
  ["node_modules/tesseract.js/dist/worker.min.js", join(out, "worker.min.js")],
  ["node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js", join(coreOut, "tesseract-core-lstm.wasm.js")],
  ["node_modules/tesseract.js-core/tesseract-core-lstm.wasm", join(coreOut, "tesseract-core-lstm.wasm")],
  ["node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js", join(coreOut, "tesseract-core-simd-lstm.wasm.js")],
  ["node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm", join(coreOut, "tesseract-core-simd-lstm.wasm")],
  [
    "node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js",
    join(coreOut, "tesseract-core-relaxedsimd-lstm.wasm.js"),
  ],
  [
    "node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm",
    join(coreOut, "tesseract-core-relaxedsimd-lstm.wasm"),
  ],
  ["node_modules/tesseract.js/LICENSE.md", join(out, "TESSERACT_LICENSE")],
  ["node_modules/tesseract.js-core/LICENSE", join(out, "TESSERACT_CORE_LICENSE")],
];

for (const lang of ["eng", "spa", "fra", "deu"]) {
  copies.push([
    `node_modules/@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`,
    join(langOut, `${lang}.traineddata.gz`),
  ]);
  copies.push([
    `node_modules/@tesseract.js-data/${lang}/README.md`,
    join(langOut, `${lang}.README.md`),
  ]);
}

let copied = 0;
for (const [from, to] of copies) {
  if (!existsSync(join(root, from))) {
    console.warn(`[copy-ocr] missing ${from}; skipping this file.`);
    continue;
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(join(root, from), to);
  copied += 1;
}
console.log(`[copy-ocr] copied ${copied} files to public/ocr`);
