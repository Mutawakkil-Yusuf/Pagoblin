/**
 * The privacy guard. Core promise: file bytes never leave the device.
 *
 * Strategy: embed a unique marker inside a generated PDF, drop it into the
 * compress tool, run the job, then assert that (a) no cross-origin request
 * was ever made and (b) no non-local request body carries the marker.
 *
 * Runs only where a chromium can launch; on this ARM device the browsers
 * crash under kernel seccomp, so tests skip.
 */
import { test, expect, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const origin = (page: Page) => new URL(page.url()).origin;

async function makeMarkedPdf(maker: string): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.addPage([595, 842]);
  const font = await pdf.embedFont("Helvetica");
  pdf.drawText(`PGOBLINTEST ${maker}`, { x: 72, y: 770, size: 24, font });
  pdf.drawText("Scan me #{maker}", { x: 72, y: 700, size: 12, font });
  const bytes = await pdf.save();
  const patched = Buffer.from(bytes).toString("latin1").replace("Scan me #", `PGOBLINTEST ${maker} #`);
  return Buffer.from(patched, "latin1");
}

test("compress run keeps file bytes local", async ({ page, browser }) => {
  // Skip gracefully where chromium cannot launch (device seccomp).
  test.skip(
    !browser,
    "chromium cannot launch on this device; privacy-e2e needs a capable machine",
  );
  const requests: { url: URL; body: string | null }[] = [];
  page.on("request", (req) => {
    try {
      requests.push({ url: new URL(req.url()), body: req.postData() ?? null });
    } catch {
      requests.push({ url: new URL("blob:"), body: null });
    }
  });

  await page.goto("/compress-pdf");

  const marked = await makeMarkedPdf(`tour-${Date.now()}`);
  const fileChooserP = page.waitForEvent("filechooser");
  await page.getByText("Add file").click();
  const chooser = await fileChooserP;
  await chooser.setFiles([{ name: "tour.pdf", mimeType: "application/pdf", buffer: marked }]);

  await expect(page.getByText("tour.pdf")).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: /Squeeze and download/i }).click();
  await expect(page.getByText(/measured|All squeezed|Squeezed/)).toBeVisible({ timeout: 120000 });

  // Every request after navigation is same-origin and internal.
  for (const r of requests) {
    if (r.url.protocol === "blob:" || r.url.protocol === "data:") continue;
    expect(r.url.origin, "cross-origin request!").toBe(origin(page));
    if (r.body) {
      expect(r.body, "marker leaked over the network!").not.toMatch(/PGOBLINTEST tour-/);
    }
  }
});
