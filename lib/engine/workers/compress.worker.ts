/** Compress worker: target-size search over one of the compress engines.
 * Engine A = Ghostscript WASM (default). Engine B = flatten (fallback and explicit).
 * All numbers reported are measured. Never claims a size it did not compute.
 */
import type { CompressInput, CompressOutput } from "../types";
import { assertNotCancelled, exposeJobs, resetCancel, u8Part } from "../worker-shared";
import { targetSizeSearch } from "../compress/targetSize";
import type { CompressEngine } from "../compress/engine-types";
import { gsCompressEngine } from "../compress/engine-gs";
import { flattenCompressEngine } from "../compress/engine-flatten";

const engines: Record<"gs" | "flatten", CompressEngine> = {
  gs: gsCompressEngine,
  flatten: flattenCompressEngine,
};

async function pickEngine(pref: CompressInput["engine"]): Promise<CompressEngine> {
  if (pref === "flatten") return engines.flatten;
  // Engine A by default; any init/trial failure gratefully degrades to Engine B.
  try {
    const ok = await engines.gs.availability();
    if (ok) return engines.gs;
  } catch {
    /* fall through */
  }
  return engines.flatten;
}

async function main(input: CompressInput, onProgress: (p: number, label?: string) => void): Promise<CompressOutput> {
  resetCancel();
  const progress = (p: number, label?: string) => {
    assertNotCancelled();
    onProgress(p, label);
  };
  progress(0.02, "Reading your file");
  const before = input.file.byteLength;

  const engine = await pickEngine(input.engine);
  const usedFallback = input.engine !== "flatten" && engine.id !== "gs";

  // Progress: every Ghostscript pass is slow on big files, so report pages inside a pass and
  // map (finished passes + page fraction) onto a smooth curve that never stalls or hits 100 early.
  let pass = 0;
  const curve = (x: number) => 0.05 + 0.88 * (x / (x + 2));
  const cache = new Map<number, { size: number; bytes: Uint8Array }>();
  const prune = (target: number) => {
    // Keep only the best fitting result and the smallest one, so memory stays bounded.
    let fit: number | null = null;
    let small: number | null = null;
    for (const [dpi, v] of cache) {
      if (v.size <= target && (fit === null || dpi > fit)) fit = dpi;
      if (small === null || v.size < cache.get(small)!.size) small = dpi;
    }
    for (const dpi of [...cache.keys()]) if (dpi !== fit && dpi !== small) cache.delete(dpi);
  };
  let pruneTarget = Number.MAX_SAFE_INTEGER;
  const attemptWithBytes = async (dpi: number) => {
    pass += 1;
    const n = pass;
    const r = await engine.attempt(
      input.file,
      input.fileName,
      dpi,
      () => assertNotCancelled(),
      (page, total) => {
        const frac = total > 0 ? Math.min(1, page / total) : 0;
        progress(curve(n - 1 + frac), total > 0 ? `Pass ${n}: page ${page} of ${total}` : `Pass ${n}`);
      },
    );
    if (r.size <= 0 || !r.bytes) throw new Error("engine trial failed");
    cache.set(dpi, { size: r.size, bytes: r.bytes });
    prune(pruneTarget);
    return { size: r.size };
  };
  /** Reuse a finished pass instead of running the whole file again. */
  const bytesAt = async (dpi: number) => {
    const hit = cache.get(dpi);
    if (hit) return { size: hit.size, bytes: hit.bytes as Uint8Array | null };
    return engine.attempt(input.file, input.fileName, dpi);
  };

  const minDpi = 24;
  const maxDpi = 180; // above this the size grows fast and the look barely changes
  const explicitTarget = input.target ?? null; // narrow once; searches use a number

  // No explicit target: squeeze hard and stop when further dpi steps stop helping.
  if (!explicitTarget) {
    const softTarget = Math.min(before, Math.round(before * 0.25));
    pruneTarget = softTarget;
    const { best, attempts } = await targetSizeSearch({
      target: softTarget,
      fileBytes: before,
      minDpi,
      maxDpi,
      attempt: attemptWithBytes,
      shouldStop: () => false,
    });
    const chosen = best ?? attempts[attempts.length - 1] ?? null;
    if (!chosen) throw new Error("engine trial failed");
    const bytes = await bytesAt(chosen.dpi);
    if (!bytes.bytes) throw new Error("engine trial failed");
    progress(1, "Done");
    return {
      blob: new Blob([u8Part(bytes.bytes)], { type: "application/pdf" }),
      before,
      after: bytes.size,
      engineUsed: engine.id,
      attempts,
      reached: true,
    };
  }

  // Already small enough: hand the file back untouched instead of re-encoding it for nothing.
  if (before <= explicitTarget) {
    progress(1, "Done");
    return { blob: new Blob([input.file], { type: "application/pdf" }), before, after: before, engineUsed: engine.id === "flatten" || usedFallback ? "flatten" : "gs", attempts: [], reached: true };
  }
  pruneTarget = explicitTarget;
  const { attempts } = await targetSizeSearch({
    target: explicitTarget,
    fileBytes: before,
    minDpi,
    maxDpi,
    attempt: attemptWithBytes,
    shouldStop: () => false,
  });

  // Find the largest dpi whose real measured size fits the target.
  const fitCandidates = attempts.filter((a) => a.size <= explicitTarget);
  const chosenDpi = fitCandidates.length ? Math.max(...fitCandidates.map((a) => a.dpi)) : minDpi;

  progress(0.95, "Finishing");
  const final = await bytesAt(chosenDpi);
  if (!final.bytes) throw new Error("engine trial failed");

  const after = final.size;
  const reached = after <= explicitTarget;
  progress(1, "Done");

  return {
    blob: new Blob([u8Part(final.bytes)], { type: "application/pdf" }),
    before,
    after,
    engineUsed: engine.id === "flatten" || usedFallback ? "flatten" : "gs",
    attempts,
    reached,
  };
}

/** Never hand back a file that is bigger than the one we were given. */
function keepSmaller(inp: CompressInput, out: CompressOutput): CompressOutput {
  if (out.after < out.before) return out;
  return {
    ...out,
    blob: new Blob([inp.file], { type: "application/pdf" }),
    after: out.before,
    reached: inp.target == null ? true : out.before <= inp.target,
  };
}

exposeJobs({
  compress: async (input, p) => {
    const inp = input as CompressInput;
    try {
      return keepSmaller(inp, await main(inp, p));
    } catch (e) {
      const err = e as Error;
      const keep = err.name === "CancelledError" || /canceled by job|password|encrypt/i.test(err.message) || inp.engine === "flatten";
      if (keep) throw e;
      // Engine A failed (WASM missing or blocked): degrade to Engine B instead of failing the job.
      console.warn("[pagoblin] Ghostscript failed, using the flatten fallback", e);
      return keepSmaller(inp, await main({ ...inp, engine: "flatten" }, p));
    }
  },
});

export type CompressApi = {
  main: typeof main;
};
