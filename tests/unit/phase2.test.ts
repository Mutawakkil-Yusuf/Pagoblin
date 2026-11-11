import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName, PDFString, StandardFonts } from "pdf-lib";
import { inspectPdfMain } from "@/lib/engine/impl/pdf-inspect";
import { sanitizeMain } from "@/lib/engine/impl/metadata";
import { compareMain, verifyMain } from "@/lib/engine/impl/verify";

function ab(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function makePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText("Hello from Pagoblin", { x: 60, y: 760, size: 18, font });
  doc.setTitle("A private document");
  doc.setAuthor("Someone");
  return await doc.save();
}

describe("PDF inspection", () => {
  it("reports metadata and the fonts referenced by page resources", async () => {
    const report = await inspectPdfMain({ file: ab(await makePdf()) });
    expect(report.pageCount).toBe(1);
    expect(report.metadata.title).toBe("A private document");
    expect(report.metadata.author).toBe("Someone");
    expect(report.fonts.some((font) => font.name === "Helvetica" && font.pages === 1)).toBe(true);
    expect(report.fonts.find((font) => font.name === "Helvetica")?.embedded).toBe(false);
  });

  it("lists empty signature fields without calling them signed", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 200]);
    const field = doc.context.obj({
      Type: "Annot",
      Subtype: "Widget",
      FT: "Sig",
      T: PDFString.of("Approval"),
      Rect: [0, 0, 0, 0],
      P: page.ref,
    });
    const ref = doc.context.register(field);
    page.node.addAnnot(ref);
    doc.catalog.getOrCreateAcroForm().addField(ref);

    const report = await inspectPdfMain({ file: ab(await doc.save()) });
    expect(report.signatures).toHaveLength(1);
    expect(report.signatures[0].field).toBe("Approval");
    expect(report.signatures[0].signed).toBe(false);
  });

  it("reads signature metadata and byte ranges", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 200]);
    const value = doc.context.obj({
      Type: "Sig",
      Filter: "Adobe.PPKLite",
      SubFilter: "adbe.pkcs7.detached",
      ByteRange: [0, 10, 20, 30],
      Contents: PDFString.of("signature"),
      M: PDFString.of("D:20260101000000Z"),
      Name: PDFString.of("Test Signer"),
    });
    const field = doc.context.obj({
      Type: "Annot",
      Subtype: "Widget",
      FT: "Sig",
      T: PDFString.of("Approval"),
      V: value,
      Rect: [0, 0, 0, 0],
      P: page.ref,
    });
    const ref = doc.context.register(field);
    page.node.addAnnot(ref);
    doc.catalog.getOrCreateAcroForm().addField(ref);

    const report = await inspectPdfMain({ file: ab(await doc.save()) });
    expect(report.signatures[0].signed).toBe(true);
    expect(report.signatures[0].subFilter).toBe("adbe.pkcs7.detached");
    expect(report.signatures[0].byteRange).toEqual([0, 10, 20, 30]);
    expect(report.signatures[0].name).toBe("Test Signer");
    expect(report.signatures[0].signedAt).toBe("D:20260101000000Z");
  });
});

describe("sanitizer", () => {
  it("rebuilds a clean copy and reports a clean scan", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 200]);
    doc.setTitle("Old title");
    doc.setAuthor("Old author");
    doc.catalog.set(PDFName.of("OpenAction"), doc.context.obj({ S: "JavaScript", JS: PDFString.of("app.alert(1)") }));
    const bytes = await doc.save();

    const out = await sanitizeMain({ file: ab(bytes) });
    const clean = await PDFDocument.load(await out.blob.arrayBuffer());
    expect(clean.getTitle()).toBe("");
    expect(clean.getAuthor()).toBe("");
    expect(clean.getCreator()).toBe("Pagoblin");
    expect(clean.getPageCount()).toBe(1);
    expect(out.afterRisks.openAction).toBe(0);
    expect(out.afterRisks.javascript).toBe(0);
    expect(out.after).toBeLessThan(out.before);
  });
});

describe("verify", () => {
  it("hashes locally and reports file facts", async () => {
    const bytes = await makePdf();
    const report = await verifyMain({ file: ab(bytes), name: "private.pdf" });
    expect(report.name).toBe("private.pdf");
    expect(report.pageCount).toBe(1);
    expect(report.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(report.sha1).toMatch(/^[0-9a-f]{40}$/);
    expect(report.sha512).toMatch(/^[0-9a-f]{128}$/);
    expect(report.signatures).toHaveLength(0);
  });

  it("calls identical files identical without reading page text", async () => {
    const bytes = await makePdf();
    const out = await compareMain({ a: ab(bytes), b: ab(bytes), aName: "a.pdf", bName: "b.pdf" });
    expect(out.identical).toBe(true);
    expect(out.a.sha256).toBe(out.b.sha256);
    expect(out.pages).toEqual([{ page: 1, status: "same" }]);
    expect(out.metadataChanges).toEqual([]);
  });
});
