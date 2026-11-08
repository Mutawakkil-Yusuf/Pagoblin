import { describe, expect, it } from "vitest";
import { formatBytes, parseTargetSize, elideName, safeStem, pluralPages, percentSaved } from "@/lib/format";

describe("formatBytes", () => {
  it("formats KB and MB without silly decimals", () => {
    expect(formatBytes(0)).toBe("0 KB");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2 * 1024)).toBe("2 KB");
    expect(formatBytes(2.1 * 1024 * 1024)).toBe("2.1 MB");
    expect(formatBytes(1500 * 1024)).toBe("1.5 MB");
    expect(formatBytes(20 * 1024 * 1024)).toBe("20 MB");
  });
  it("shows a dash for nonsense", () => {
    expect(formatBytes(NaN)).toBe("—");
    expect(formatBytes(-5)).toBe("—");
  });
});

describe("parseTargetSize", () => {
  it("parses everyday inputs", () => {
    expect(parseTargetSize("2")).toBe(2 * 1024 * 1024);
    expect(parseTargetSize("2 MB")).toBe(2 * 1024 * 1024);
    expect(parseTargetSize("1.5mb")).toBe(1.5 * 1024 * 1024);
    expect(parseTargetSize("800 KB")).toBe(800 * 1024);
    expect(parseTargetSize("800k")).toBe(800 * 1024);
    expect(parseTargetSize("1 000 KB")).toBe(1024 * 1000);
  });
  it("fails calm on rubbish", () => {
    expect(Number.isNaN(parseTargetSize("abc"))).toBe(true);
    expect(Number.isNaN(parseTargetSize(""))).toBe(true);
  });
});

describe("elideName", () => {
  it("keeps the extension and the length bound", () => {
    const out = elideName("Job application questionaire july final.pdf", 20);
    expect(out.endsWith(".pdf")).toBe(true);
    expect(out).toContain("…");
    expect(out.length).toBeLessThanOrEqual(21);
  });
  it("does not touch short names", () => {
    expect(elideName("a.pdf")).toBe("a.pdf");
  });
});

describe("safeStem", () => {
  it("strips filesystem-hostile characters", () => {
    expect(safeStem('my: report "final" v2?')).toBe("my report final v2");
    expect(safeStem("")).toBe("file");
  });
});

describe("pluralPages and percentSaved", () => {
  it("pluralises", () => {
    expect(pluralPages(1)).toBe("1 page");
    expect(pluralPages(9)).toBe("9 pages");
  });
  it("counts saved per cent, never negative", () => {
    expect(percentSaved(1000, 800)).toBe(20);
    expect(percentSaved(1000, 1200)).toBe(0);
    expect(percentSaved(0, 10)).toBe(0);
  });
});
