import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { organizeMain } from "@/lib/engine/impl/organize";
import { readMetadataMain, sanitizeMain, scanPdfRisks, writeMetadataMain } from "@/lib/engine/impl/metadata";
import { fillFormMain, inspectFormMain } from "@/lib/engine/impl/forms";
import { itemsToLines, linesToMarkdown, linesToPlainText } from "@/lib/engine/impl/text-extract";
import { boxToPixels, normalizeBox } from "@/lib/engine/impl/redact";
import { protectArgs, unlockArgs } from "@/lib/engine/impl/qpdf";

function ab(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function makePdf(pages: number, size: [number, number] = [595, 842]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage(size);
  return await doc.save();
}

describe("organizeMain", () => {
  it("rebuilds pages in the requested order, with duplicates and rotation", async () => {
    const a = await makePdf(3, [595, 842]);
    const b = await makePdf(2, [300, 400]);
    const out = await organizeMain({
      sources: [ab(a), ab(b)],
      pages: [
        { source: 0, page: 2, rotation: 90 },
        { source: 1, page: 1, rotation: 0 },
        { source: 0, page: 2, rotation: 0 },
      ],
    });
    expect(out.pages).toBe(3);
    const doc = await PDFDocument.load(await out.blob.arrayBuffer());
    expect(doc.getPageCount()).toBe(3);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(doc.getPage(1).getWidth()).toBe(300);
    expect(doc.getPage(2).getRotation().angle).toBe(0);
  });

  it("refuses an empty page list", async () => {
    const a = await makePdf(1);
    await expect(organizeMain({ sources: [ab(a)], pages: [] })).rejects.toThrow("Choose at least one page.");
  });
});

describe("metadata", () => {
  it("reads and writes the document properties", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([595, 842]);
    doc.setTitle("Old title");
    doc.setAuthor("Old author");
    const bytes = await doc.save();

    const before = await readMetadataMain({ file: ab(bytes) });
    expect(before.metadata.title).toBe("Old title");
    expect(before.metadata.author).toBe("Old author");

    const written = await writeMetadataMain({
      file: ab(bytes),
      metadata: { title: "New title", author: "New author", keywords: "one, two" },
    });
    const check = await PDFDocument.load(await written.blob.arrayBuffer());
    expect(check.getTitle()).toBe("New title");
    expect(check.getAuthor()).toBe("New author");
    expect(check.getKeywords()).toBe("one, two");
  });

  it("flags common structural signals in raw bytes", () => {
    const raw = new TextEncoder().encode(
      "%PDF-1.7 /JavaScript /JS /OpenAction /EmbeddedFiles /Filespec /URI /Annots /Metadata /AcroForm /XFA",
    );
    const risks = scanPdfRisks(raw);
    expect(risks.javascript).toBeGreaterThan(0);
    expect(risks.openAction).toBe(1);
    expect(risks.embeddedFiles).toBeGreaterThan(0);
    expect(risks.uri).toBe(1);
    expect(risks.xmp).toBe(true);
    expect(risks.acroForm).toBe(true);
    expect(risks.xfa).toBe(true);
  });

  it("rebuilds a clean copy with empty metadata", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([595, 842]);
    doc.setTitle("Sensitive title");
    doc.setAuthor("Sensitive author");
    const bytes = await doc.save();
    const out = await sanitizeMain({ file: ab(bytes) });
    const check = await PDFDocument.load(await out.blob.arrayBuffer());
    expect(check.getPageCount()).toBe(1);
    expect(check.getTitle() ?? "").toBe("");
    expect(check.getAuthor() ?? "").toBe("");
    expect(out.before).toBe(bytes.byteLength);
    expect(out.after).toBeGreaterThan(0);
  });
});

describe("forms", () => {
  async function makeForm(): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([600, 800]);
    const form = doc.getForm();
    const name = form.createTextField("name");
    name.addToPage(page, { x: 50, y: 700, width: 200, height: 24 });
    const agree = form.createCheckBox("agree");
    agree.addToPage(page, { x: 50, y: 650, width: 20, height: 20 });
    const color = form.createDropdown("color");
    color.setOptions(["red", "blue"]);
    color.addToPage(page, { x: 50, y: 600, width: 120, height: 24 });
    const size = form.createRadioGroup("size");
    size.addOptionToPage("S", page, { x: 50, y: 550, width: 20, height: 20 });
    size.addOptionToPage("M", page, { x: 90, y: 550, width: 20, height: 20 });
    return await doc.save();
  }

  it("inspects field names, types and options", async () => {
    const bytes = await makeForm();
    const out = await inspectFormMain({ file: ab(bytes) });
    expect(out.fields.map((f) => f.name).sort()).toEqual(["agree", "color", "name", "size"]);
    expect(out.fields.find((f) => f.name === "color")?.options).toEqual(["red", "blue"]);
    expect(out.fields.find((f) => f.name === "size")?.type).toBe("radio");
  });

  it("fills and flattens the fields into the page", async () => {
    const bytes = await makeForm();
    const out = await fillFormMain({
      file: ab(bytes),
      values: { name: "Ada Lovelace", agree: true, color: "blue", size: "M" },
      flatten: true,
    });
    expect(out.filled).toBe(4);
    expect(out.skipped).toEqual([]);
    const doc = await PDFDocument.load(await out.blob.arrayBuffer());
    expect(doc.getForm().getFields()).toHaveLength(0);
  });
});

describe("text extraction layout", () => {
  it("groups runs into visual lines, keeps order and adds word gaps", () => {
    const lines = itemsToLines([
      { str: "World", transform: [1, 0, 0, 1, 80, 700], width: 40, height: 14 },
      { str: "Hello", transform: [1, 0, 0, 1, 40, 700], width: 35, height: 14 },
      { str: "Second line", transform: [1, 0, 0, 1, 40, 680], width: 80, height: 14 },
    ]);
    expect(lines.map((l) => l.text)).toEqual(["Hello World", "Second line"]);
    expect(linesToPlainText(lines)).toBe("Hello World\nSecond line");
  });

  it("turns larger lines into headings and bullets into lists", () => {
    const lines = itemsToLines([
      { str: "Big Title", transform: [1, 0, 0, 1, 40, 760], width: 100, height: 28 },
      { str: "Body text", transform: [1, 0, 0, 1, 40, 720], width: 70, height: 12 },
      { str: "• first", transform: [1, 0, 0, 1, 40, 700], width: 50, height: 12 },
    ]);
    const md = linesToMarkdown(lines);
    expect(md).toContain("# Big Title");
    expect(md).toContain("- first");
    expect(md).toContain("Body text");
  });
});

describe("redaction geometry", () => {
  it("normalizes a box dragged up and left", () => {
    expect(normalizeBox({ x: 0.8, y: 0.7, w: -0.2, h: -0.1 })).toEqual({ x: 0.6, y: 0.6, w: 0.2, h: 0.1 });
  });

  it("maps fractions to pixels and never returns an empty box", () => {
    expect(boxToPixels({ x: 0.1, y: 0.2, w: 0.3, h: 0.4 }, 1000, 500)).toEqual({
      x: 100,
      y: 100,
      w: 300,
      h: 200,
    });
    const tiny = boxToPixels({ x: 0.5, y: 0.5, w: 0, h: 0 }, 100, 100);
    expect(tiny.w).toBe(1);
    expect(tiny.h).toBe(1);
  });
});

describe("qpdf arguments", () => {
  it("builds an AES-256 protect command with permission flags", () => {
    expect(
      protectArgs({
        userPassword: "open",
        ownerPassword: "owner",
        keyLength: 256,
        permissions: { print: true, modify: false, copy: false, annotate: true },
      }),
    ).toEqual([
      "--encrypt",
      "open",
      "owner",
      "256",
      "--print=full",
      "--modify=none",
      "--extract=n",
      "--annotate=y",
      "--",
      "/in.pdf",
      "/out.pdf",
    ]);
  });

  it("adds AES for 128-bit keys and builds an unlock command", () => {
    expect(
      protectArgs({
        userPassword: "a",
        ownerPassword: "b",
        keyLength: 128,
        permissions: { print: false, modify: false, copy: false, annotate: false },
      }),
    ).toContain("--use-aes=y");
    expect(unlockArgs("secret")).toEqual(["--password=secret", "--decrypt", "/in.pdf", "/out.pdf"]);
  });
});
