import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { mergeMain } from "@/lib/engine/impl/merge";
import { splitMain } from "@/lib/engine/impl/split";
import { textToPdfMain } from "@/lib/engine/impl/text";
import { parseRanges } from "@/lib/ranges";

async function makePdf(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([595, 842]);
  return await doc.save();
}

async function blobBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

describe("mergeMain (the real worker core)", () => {
  it("melds two PDFs in order and reports the page count", async () => {
    const a = await makePdf(3);
    const b = await makePdf(9);
    const out = await mergeMain({
      files: [
        { name: "a.pdf", buffer: a.buffer as ArrayBuffer },
        { name: "b.pdf", buffer: b.buffer as ArrayBuffer },
      ],
    });
    expect(out.pages).toBe(12);
    const check = await PDFDocument.load(await blobBytes(out.blob));
    expect(check.getPageCount()).toBe(12);
  });

  it("stops scream-free on progress", async () => {
    const marks: number[] = [];
    await mergeMain(
      { files: [{ name: "a.pdf", buffer: (await makePdf(2)).buffer as ArrayBuffer }] },
      (p) => marks.push(p),
    );
    expect(marks.at(-1)).toBe(1);
  });
});

describe("splitMain (the real worker core)", () => {
  const buf = async () => await makePdf(9);

  it("pick keeps the chosen pages in one PDF", async () => {
    const out = await splitMain({ mode: "pick", file: (await buf()).buffer as ArrayBuffer, pages: [2, 7, 9], pageCount: 9 });
    expect(out.count).toBe(1);
    const check = await PDFDocument.load(await blobBytes(out.blobs[0].blob));
    expect(check.getPageCount()).toBe(3);
  });

  it("ranges give one PDF per range, open ends resolved by the parser", async () => {
    const parsed = parseRanges("1-3, 5, 8-", 9);
    const ranges = parsed.tokens
      .filter((t) => t.type === "range" || t.type === "page")
      .map((t) => (t.type === "range" ? { start: t.start, end: t.end } : { start: t.page, end: t.page }));
    const out = await splitMain({ mode: "ranges", file: (await buf()).buffer as ArrayBuffer, ranges });
    expect(out.count).toBe(3);
    const sizes = await Promise.all(out.blobs.map((b) => blobBytes(b.blob).then((d) => PDFDocument.load(d).then((p) => p.getPageCount()))));
    expect(sizes).toEqual([3, 1, 2]);
  });

  it("every page produces one PDF per page", async () => {
    const out = await splitMain({ mode: "every", file: (await buf()).buffer as ArrayBuffer, pageCount: 9 });
    expect(out.count).toBe(9);
    expect(out.blobs[8].name).toBe("page-9");
  });
});

describe("textToPdfMain (the real worker core)", () => {
  it("types bytes that are a real, single-page PDF", async () => {
    const out = await textToPdfMain({ text: "Dear Pip,\nPlease keep this on the device.\n" });
    expect(out.pages).toBe(1);
    const head = await out.blob.slice(0, 5).text();
    expect(head).toBe("%PDF-");
    const check = await PDFDocument.load(await blobBytes(out.blob));
    expect(check.getPageCount()).toBe(1);
  });

  it("paginates long text", async () => {
    // ~4200 words so it wraps past one A4 page.
    const text = Array.from({ length: 120 }, () => "The goblin never uploads your file. ").join("");
    const out = await textToPdfMain({ text });
    expect(out.pages).toBeGreaterThan(1);
  });
});
