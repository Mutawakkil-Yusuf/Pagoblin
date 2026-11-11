/** Heavy engines are not precached (that would add ~45 MB to every first visit).
 * They are cached the first time a tool uses them, or on demand with warmOffline(). */
export const ENGINE_CACHE = "engine-assets";
export const OFFLINE_ASSETS = [
  "/gs-worker.js",
  "/gs/gs.js",
  "/gs/gs.wasm",
  "/pdfjs/pdf.worker.min.mjs",
  "/qpdf-worker.js",
  "/qpdf/qpdf.js",
  "/qpdf/qpdf.wasm",
  "/ocr/worker.min.js",
  "/ocr/core/tesseract-core-lstm.wasm.js",
  "/ocr/core/tesseract-core-lstm.wasm",
  "/ocr/core/tesseract-core-simd-lstm.wasm.js",
  "/ocr/core/tesseract-core-simd-lstm.wasm",
  "/ocr/core/tesseract-core-relaxedsimd-lstm.wasm.js",
  "/ocr/core/tesseract-core-relaxedsimd-lstm.wasm",
  "/ocr/lang/eng.traineddata.gz",
  "/ocr/lang/spa.traineddata.gz",
  "/ocr/lang/fra.traineddata.gz",
  "/ocr/lang/deu.traineddata.gz",
];
export const OFFLINE_SIZE_LABEL = "about 45 MB";

export async function isOfflineReady(): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  try {
    const cache = await caches.open(ENGINE_CACHE);
    const hits = await Promise.all(OFFLINE_ASSETS.map((u) => cache.match(u)));
    return hits.every(Boolean);
  } catch {
    return false;
  }
}

/** Download every engine asset into the same cache the service worker reads from. */
export async function warmOffline(onProgress?: (done: number, total: number) => void): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  try {
    const cache = await caches.open(ENGINE_CACHE);
    let done = 0;
    for (const url of OFFLINE_ASSETS) {
      if (!(await cache.match(url))) {
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) return false;
        await cache.put(url, res);
      }
      done += 1;
      onProgress?.(done, OFFLINE_ASSETS.length);
    }
    return true;
  } catch {
    return false;
  }
}
