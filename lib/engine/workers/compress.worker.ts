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

  const attemptWithBytes = async (dpi: number) => {
    const r = await engine.attempt(input.file, input.fileName, dpi, () => {
      // Engine-internal checkpoint; cancellation is polled here and between trials.
      assertNotCancelled();
    });
    if (r.size <= 0 || !r.bytes) throw new Error("engine trial failed");
    return { size: r.size };
  };

  const minDpi = 24;
  const maxDpi = 240;
  const explicitTarget = input.target ?? null; // narrow once; searches use a number

  // No explicit target: squeeze hard and stop when further dpi steps stop helping.
  if (!explicitTarget) {
    progress(0.1, "Halfway through the meal");
    const softTarget = Math.min(before, Math.round(before * 0.25));
    const { best, attempts } = await targetSizeSearch({
      target: softTarget,
      fileBytes: before,
      minDpi,
      maxDpi,
      attempt: attemptWithBytes,
      shouldStop: () => false,
      onAttempt: (t, i) => {
        progress(Math.min(0.9, 0.1 + i * 0.12), `Try ${i}: ${Math.round(t.dpi)} dpi`);
      },
    });
    const chosen = best ?? attempts[attempts.length - 1] ?? null;
    if (!chosen) throw new Error("engine trial failed");
    const bytes = await engine.attempt(input.file, input.fileName, chosen.dpi);
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

  const { attempts } = await targetSizeSearch({
    target: explicitTarget,
    fileBytes: before,
    minDpi,
    maxDpi,
    attempt: attemptWithBytes,
    shouldStop: () => false,
    onAttempt: (t, i) => {
      progress(Math.min(0.92, 0.05 + i * 0.13), `Try ${i}: ${Math.round(t.dpi)} dpi`);
    },
  });

  // Find the largest dpi whose real measured size fits the target.
  const fitCandidates = attempts.filter((a) => a.size <= explicitTarget);
  const chosenDpi = fitCandidates.length ? Math.max(...fitCandidates.map((a) => a.dpi)) : minDpi;

  progress(0.94, "Finishing");
  const final = await engine.attempt(input.file, input.fileName, chosenDpi);
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

exposeJobs({
  compress: (input, p) => {
    // the inner main() polls cancellation through assertNotCancelled itself
    return main(input as CompressInput, p);
  },
});

export type CompressApi = {
  main: typeof main;
};
