/* Smoke: load the tool pages in headless chromium, catch console errors, shots. */
import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.env.BASE ?? "http://127.0.0.1:3113";
const shots = "/tmp/opencode/shots";
fs.mkdirSync(shots, { recursive: true });

const pages = ["/", "/app", "/app/tools", "/merge-pdf", "/split-pdf", "/compress-pdf", "/convert-pdf", "/settings", "/flows", "/done"];
const browser = await chromium.launch({ args: ["--no-proxy-server", "--no-sandbox", "--disable-gpu"] });
const errors = {};
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") (errors[m.type()] ??= []).push(m.text().slice(0, 220));
});
page.on("pageerror", (e) => (errors.page ??= []).push(String(e).slice(0, 220)));

for (const p of pages) {
  await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 30000 });
  const name = p === "/" ? "home" : p.replaceAll("/", "-").replace(/^-/, "");
  await page.screenshot({ path: `${shots}/${name}.png`, fullPage: false });
  console.log("shot", p);
}
console.log(JSON.stringify({ errors }, null, 1));
await browser.close();
