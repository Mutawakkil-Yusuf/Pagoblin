/// <reference lib="webworker" />
declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (import("serwist").PrecacheEntry | string)[] | undefined;
  }
}

/**
 * Pagoblin service worker.
 * - Precaches the app shell (Serwist manifest from the build).
 * - Runtime-caches self-hosted engine assets (/pdfjs/*, /gs/*) so heavy
 *   engines are already on the device the second time.
 * - Handles Web Share Target POSTs: shared PDFs are stashed locally and the
 *   page reads them from the Cache API. File bytes never touch a network.
 */
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "serwist";
import {
  Serwist,
  CacheFirst,
  NetworkFirst,
  CacheableResponsePlugin,
  type RuntimeCaching,
} from "serwist";

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST?: (PrecacheEntry | string)[] };

const engineAssets: RuntimeCaching = {
  matcher: ({ url, request }) =>
    request.method === "GET" &&
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/pdfjs/") || url.pathname.startsWith("/gs/") || url.pathname === "/gs-worker.js"),
  handler: new CacheFirst({
    cacheName: "engine-assets",
    plugins: [new CacheableResponsePlugin({ statuses: [200] })],
  }),
};

/**
 * Client-side navigations (router.push("/done")) fetch an RSC payload, not HTML. Finished results live
 * in memory, so those navigations must also work offline or the result would be lost on a reload.
 * NetworkFirst, falling back to any cached payload for the same route (ignoring the _rsc hash).
 */
const rscOffline: RuntimeCaching = {
  matcher: ({ request, sameOrigin }) => sameOrigin && request.method === "GET" && request.headers.get("RSC") === "1",
  handler: new NetworkFirst({
    cacheName: "rsc-offline",
    networkTimeoutSeconds: 4,
    matchOptions: { ignoreSearch: true, ignoreVary: true },
    plugins: [new CacheableResponsePlugin({ statuses: [200] })],
  }),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [engineAssets, rscOffline, ...defaultCache],
  disableDevLogs: true,
});

const SHARE_CACHE = "share-target";

/**
 * POST /share arrives from the OS share sheet (manifest share_target).
 * Stash files locally, then send the user to /share which ingests them and
 * routes to a tool — entirely on-device.
 */
const shareTarget = async (request: Request): Promise<Response> => {
  try {
    const form = await request.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    const cache = await caches.open(SHARE_CACHE);
    const meta: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const key = `/shared/${i}`;
      await cache.put(key, new Response(files[i]));
      meta.push(JSON.stringify({ key, name: files[i].name, type: files[i].type }));
    }
    await cache.put("/shared/_list", new Response(JSON.stringify(meta)));
    return Response.redirect("/share?received=1", 303);
  } catch {
    return Response.redirect("/app", 303);
  }
};

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.origin === self.location.origin && url.pathname === "/share") {
    event.respondWith(shareTarget(event.request));
  }
});

serwist.addEventListeners();
