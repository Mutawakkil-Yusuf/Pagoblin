import { describe, expect, it } from "vitest";
import { parseRanges, pagesToRanges } from "@/lib/ranges";

describe("parseRanges", () => {
  const N = 10;

  it("handles pages, ranges and open ends", () => {
    expect(parseRanges("1-3,5,8-", N).pages).toEqual([1, 2, 3, 5, 8, 9, 10]);
    expect(parseRanges("-4", N).pages).toEqual([1, 2, 3, 4]);
  });

  it("dedupes and stays sorted", () => {
    expect(parseRanges("5,2,3", N).pages).toEqual([2, 3, 5]);
  });

  it("flags out-of-bound pages with a calm message", () => {
    const r = parseRanges("1,12", N);
    expect(r.ok).toBe(false);
    const err = r.tokens.find((t) => t.type === "error");
    expect(err && err.type === "error" ? err.message : "").toContain("does not exist");
  });

  it("flags backwards ranges without jokes", () => {
    const r = parseRanges("5-2", N);
    expect(r.ok).toBe(false);
    const err = r.tokens.find((t) => t.type === "error");
    expect(err && err.type === "error" ? err.message : "").toContain("Swap the numbers");
  });

  it("rejects mystery shapes with guidance", () => {
    const r = parseRanges("1:3", N);
    expect(r.ok).toBe(false);
    const err = r.tokens.find((t) => t.type === "error");
    expect(err && err.type === "error" ? err.message : "").toContain("Use this shape");
  });
});

describe("pagesToRanges", () => {
  it("collapses runs", () => {
    expect(pagesToRanges([1, 2, 3, 7, 8, 9])).toBe("1-3, 7-9");
    expect(pagesToRanges([1])).toBe("1");
    expect(pagesToRanges([1, 3, 4])).toBe("1, 3-4");
  });
});
