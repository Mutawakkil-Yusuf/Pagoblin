/**
 * Generate public/og.png (1200x630) from the brand SVG and system DejaVu fonts.
 * Committed output means the OG image is available to crawlers without a
 * runtime image service. Re-run with `npm run og` after changing the copy.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const pipSvg = await readFile(path.join(root, "design-kit/assets/pip-happy.svg"));
const pipPng = await sharp(pipSvg).resize(300, 294).png().toBuffer();

const background = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#17130F"/>
  <rect x="0" y="0" width="1200" height="10" fill="#FF9F1C"/>
  <circle cx="225" cy="330" r="205" fill="#241D16"/>
  <circle cx="1080" cy="90" r="210" fill="#241D16"/>
  <circle cx="1120" cy="580" r="150" fill="#241D16"/>
  <text x="420" y="190" font-family="DejaVu Sans" font-weight="bold" font-size="82" fill="#FFF1DC" letter-spacing="-2">Pagoblin</text>
  <text x="420" y="280" font-family="DejaVu Sans" font-size="38" fill="#FFF1DC">PDF tools that never ask</text>
  <text x="420" y="330" font-family="DejaVu Sans" font-size="38" fill="#FFF1DC">for your files.</text>
  <text x="420" y="410" font-family="DejaVu Sans" font-weight="bold" font-size="25" fill="#FF9F1C">No uploads  ·  No accounts  ·  Works offline</text>
  <text x="420" y="505" font-family="DejaVu Sans" font-size="24" fill="#C9BBA8">pagoblin.vercel.app</text>
  <text x="420" y="545" font-family="DejaVu Sans" font-size="20" fill="#C9BBA8">Free core  ·  AGPL-3.0  ·  Open source</text>
</svg>`;

const png = await sharp(Buffer.from(background))
  .composite([{ input: pipPng, left: 75, top: 170 }])
  .png()
  .toBuffer();

await writeFile(path.join(root, "public/og.png"), png);
console.log("wrote public/og.png");
