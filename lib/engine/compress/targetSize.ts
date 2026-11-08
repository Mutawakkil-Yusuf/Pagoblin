/** Compress engine contracts and the target-size search driver (pure, unit tested). */

export type CompressTrialResult = { dpi: number; size: number };

export type CompressAttemptFn = (dpi: number) => Promise<{ size: number }>;

/**
 * Binary search the render density that fits the target.
 * lo is guaranteed feasible in the abstract search only when it compresses
 * enough; we re-derive from real measurements:
 *  - If lo trial already fits, we raise lo until just below the threshold of
 *    failing, so quality stays as high as the target allows.
 * Records every real attempt so the UI can show honest numbers.
 * Never fabricates a size: all numbers come from real engine runs.
 */
export async function targetSizeSearch(opts: {
  target: number;
  fileBytes: number;
  minDpi: number;
  maxDpi: number;
  attempt: CompressAttemptFn;
  shouldStop?: () => boolean;
  onAttempt?: (t: CompressTrialResult, i: number, total: number) => void;
}): Promise<{ best: { dpi: number; size: number } | null; attempts: CompressTrialResult[] }> {
  const { target, minDpi, maxDpi, attempt, shouldStop, onAttempt } = opts;
  const attempts: CompressTrialResult[] = [];
  let best: CompressTrialResult | null = null;

  const record = (dpi: number, size: number) => {
    attempts.push({ dpi, size });
    if (size <= target && (!best || dpi > best.dpi)) best = { dpi, size };
    onAttempt?.({ dpi, size }, attempts.length, 0);
  };

  // Seed the bounds with real measurements.
  let lo = minDpi;
  let hi = maxDpi;
  const loSize = (await attempt(lo)).size;
  if (shouldStop?.()) return { best, attempts };
  record(lo, loSize);

  // Even lowest dpi is too big: report honestly.
  if (loSize <= target) {
    // Try to climb quality while staying under target.
    hi = maxDpi;
  } else {
    // Minimum density still overflows: no fitting result exists.
    return { best: null, attempts };
  }

  while (hi - lo > Math.max(6, lo * 0.08)) {
    if (shouldStop?.()) return { best, attempts };
    const mid = Math.round((lo + hi) / 2);
    const size = (await attempt(mid)).size;
    record(mid, size);
    if (shouldStop?.()) return { best, attempts };
    if (size <= target) {
      lo = mid; // feasible: keep it, push quality up
    } else {
      hi = mid; // too big: reduce quality (dpi down)
    }
  }
  return { best, attempts };
}
