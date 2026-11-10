/** Compress engine contracts and the target-size search driver (pure, unit tested). */

export type CompressTrialResult = { dpi: number; size: number };

export type CompressAttemptFn = (dpi: number) => Promise<{ size: number }>;

/**
 * Find the highest render density whose REAL measured size fits the target, in as few passes
 * as possible. Every pass is a full run over the file (slow on big PDFs and phones), so instead
 * of plain bisection we model size as roughly linear in dpi squared and interpolate.
 *  1. Measure the floor (minDpi). If even that is too big, nothing fits: report honestly.
 *  2. Probe a middle density, then jump towards the target by interpolating between the
 *     closest fitting and the closest too-big measurement.
 *  3. Stop when a fitting result is within 15% of the target, the bracket is narrow, or the
 *     pass budget (maxAttempts) is used. The best real fitting measurement wins.
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
  maxAttempts?: number;
}): Promise<{ best: { dpi: number; size: number } | null; attempts: CompressTrialResult[] }> {
  const { target, minDpi, maxDpi, attempt, shouldStop, onAttempt } = opts;
  const maxAttempts = opts.maxAttempts ?? 5;
  const attempts: CompressTrialResult[] = [];
  let best: CompressTrialResult | null = null;

  const record = (dpi: number, size: number) => {
    attempts.push({ dpi, size });
    if (size <= target && (!best || dpi > best.dpi)) best = { dpi, size };
    onAttempt?.({ dpi, size }, attempts.length, 0);
  };

  const loSize = (await attempt(minDpi)).size;
  record(minDpi, loSize);
  if (shouldStop?.()) return { best, attempts };
  // Even the lowest density overflows: no fitting result exists.
  if (loSize > target) return { best: null, attempts };

  let lo: CompressTrialResult = { dpi: minDpi, size: loSize }; // closest fitting
  let hi: CompressTrialResult | null = null; // closest too big
  let probe = Math.min(maxDpi, 96);

  while (attempts.length < maxAttempts && probe > lo.dpi) {
    if (shouldStop?.()) break;
    const size = (await attempt(probe)).size;
    record(probe, size);
    if (shouldStop?.()) break;
    if (size <= target) {
      lo = { dpi: probe, size };
      if (size >= target * 0.85 || probe >= maxDpi) break; // close enough, or at the ceiling
    } else {
      hi = { dpi: probe, size };
    }

    let next: number;
    if (hi) {
      if (hi.dpi - lo.dpi <= Math.max(12, lo.dpi * 0.2)) break; // bracket is narrow enough
      const f = (target - lo.size) / (hi.size - lo.size);
      next = Math.sqrt(lo.dpi ** 2 + f * (hi.dpi ** 2 - lo.dpi ** 2));
      next = Math.min(Math.max(next, lo.dpi + 6), hi.dpi - 6);
    } else {
      // Everything so far fits: extrapolate from the floor through the latest fitting point.
      const slope = (lo.size - loSize) / (lo.dpi ** 2 - minDpi ** 2);
      next = slope > 0 ? Math.sqrt(lo.dpi ** 2 + (target - lo.size) / slope) : maxDpi;
      next = Math.min(maxDpi, Math.max(next, lo.dpi + 12));
    }
    probe = Math.round(next);
  }
  return { best, attempts };
}
