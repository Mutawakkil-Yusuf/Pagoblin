// Generates PWA icons from design-kit/assets/app-icon.svg (192, 512, maskable).
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const src = "design-kit/assets/app-icon.svg";
const outDir = "public/icons";
mkdirSync(outDir, { recursive: true });

const icon512 = await sharp(src, { limitInputPixels: false, density: 600 }).resize(512, 512).png().toBuffer();

await sharp(icon512).resize(192, 192).png().toFile(`${outDir}/icon-192.png`);
await sharp(icon512).resize(512, 512).png().toFile(`${outDir}/icon-512.png`);

// Maskable: full-bleed ink background, logo content scaled into the 80% safe zone.
const inner = await sharp(icon512).resize(410, 410).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: { r: 23, g: 19, b: 15, alpha: 1 } },
})
  .composite([{ input: inner, gravity: "centre", blend: "over" }])
  .png()
  .toFile(`${outDir}/icon-maskable-512.png`);

// favicon raster fallback for old browsers
await sharp(icon512).resize(64, 64).png().toFile(`${outDir}/favicon-64.png`);

// apple-touch icon (flat, no transparency)
await sharp(icon512).resize(180, 180).flatten({ background: "#17130F" }).png().toFile(`${outDir}/apple-touch-icon.png`);

writeFileSync(`${outDir}/README.txt`, "Generated from design-kit/assets/app-icon.svg by scripts/generate-icons.mjs\n");
console.log("[icons] ok");
