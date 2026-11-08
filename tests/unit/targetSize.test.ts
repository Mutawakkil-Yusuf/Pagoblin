import { describe, expect, it, vi } from "vitest";
import { targetSizeSearch } from "@/lib/engine/compress/targetSize";

describe("targetSizeSearch", () => {
  it("finds the highest feasible dpi with real measurements only", async () => {
    // Size grows with dpi; target fits once dpi <= 160.
    const attempt = vi.fn(async (dpi: number) => ({ size: Math.round(10_000_000 * (dpi / 300) ** 1.4) }));
    const { best, attempts } = await targetSizeSearch({
      target: 2_000_000,
      fileBytes: 10_000_000,
      minDpi: 24,
      maxDpi: 240,
      attempt,
    });
    expect(attempts.length).toBeGreaterThan(2);
    expect(best).not.toBeNull();
    if (best) {
      expect(best.size).toBeLessThanOrEqual(2_000_000);
      // Every recorded attempt matches the fake engine (no fabricated numbers).
      for (const a of attempts) expect(a.size).toBe(Math.round(10_000_000 * (a.dpi / 300) ** 1.4));
    }
  });

  it("reports honestly when nothing fits", async () => {
    const attempt = async () => ({ size: 9_000_000 });
    const { best } = await targetSizeSearch({ target: 100_000, fileBytes: 9_000_000, minDpi: 24, maxDpi: 240, attempt });
    expect(best).toBeNull();
  });

  it("stops when shouldStop fires", async () => {
    let calls = 0;
    const attempt = async () => {
      calls++;
      return { size: 500_000 };
    };
    await targetSizeSearch({
      target: 100_000,
      fileBytes: 5_000_000,
      minDpi: 24,
      maxDpi: 240,
      attempt,
      shouldStop: () => calls >= 1,
    });
    expect(calls).toBe(1);
  });
});
