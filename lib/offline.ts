/** Heavy engines are not precached (that would add ~18 MB to every first visit).
 * They are cached the first time a tool uses them, or on demand with warmOffline(). */
export const ENGINE_CACHE = "engine-assets";
export const OFFLINE_ASSETS = ["/gs-worker.js", "/gs/gs.js", "/gs/gs.wasm", "/pdfjs/pdf.worker.min.mjs"];
export const OFFLINE_SIZE_LABEL = "about 18 MB";

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
