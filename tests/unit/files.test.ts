import { describe, expect, it } from "vitest";
import { fileErrors, makeFileItems } from "@/lib/files";

const enc = new TextEncoder();
const pdf = (prefix = "") => enc.encode(`${prefix}%PDF-1.7\n1 0 obj\n<<>>\nendobj\n`);
const png = () => new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

function file(bytes: Uint8Array, name: string, type = "") {
  return new File([bytes.buffer as ArrayBuffer], name, { type });
}

describe("makeFileItems ingestion", () => {
  it("accepts a PDF whose provider sends no MIME type and no extension", async () => {
    const out = await makeFileItems([file(pdf(), "document")], { accept: ["pdf"], toolLabel: "Merge" });
    expect(out.rejects).toEqual([]);
    expect(out.items).toHaveLength(1);
    expect(out.items[0].kind).toBe("pdf");
  });

  it("accepts a PDF with junk before the %PDF header, within the first kilobyte", async () => {
    const out = await makeFileItems([file(pdf("Mail attachment: "), "weird.bin", "application/octet-stream")], {
      accept: ["pdf"],
      toolLabel: "Merge",
    });
    expect(out.rejects).toEqual([]);
    expect(out.items).toHaveLength(1);
  });

  it("sniffs an image by its magic bytes when the name and type say nothing", async () => {
    const out = await makeFileItems([file(png(), "IMG_0001")], { accept: ["image"], toolLabel: "Convert" });
    expect(out.rejects).toEqual([]);
    expect(out.items[0].kind).toBe("image");
  });

  it("still rejects a file that claims to be a PDF but is not one", async () => {
    const out = await makeFileItems([file(enc.encode("just words"), "fake.pdf", "application/pdf")], {
      accept: ["pdf"],
      toolLabel: "Merge",
    });
    expect(out.items).toEqual([]);
    expect(out.rejects).toEqual([{ name: "fake.pdf", reason: fileErrors.unopenable }]);
  });

  it("rejects a real image dropped on a PDF tool with the PDF copy", async () => {
    const out = await makeFileItems([file(png(), "photo.png", "image/png")], { accept: ["pdf"], toolLabel: "Merge" });
    expect(out.items).toEqual([]);
    expect(out.rejects[0].reason).toBe(fileErrors.notPdf);
  });
});
