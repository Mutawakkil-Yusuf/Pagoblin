import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const isDev = process.env.NODE_ENV === "development";

// Analytics host is optional and only wired when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set.
const plausibleHost = process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || "https://plausible.io";
const analytics = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? ` ${plausibleHost}` : "";

// connect-src stays 'self' (+ Plausible). File bytes can never leave the device;
// the privacy e2e test enforces this at runtime.
const csp = [
  `default-src 'self'`,
  // 'wasm-unsafe-eval' is required to instantiate Emscripten/JS engines (Ghostscript WASM)
  // in workers. 'unsafe-inline' is required by the App Router's inline RSC bootstrap
  // scripts: every page stays statically prerendered (offline-first) instead of going
  // dynamic for per-request nonces. There is no server-rendered user data, so the
  // reachable XSS surface stays nil; the hard guarantees (connect-src 'self',
  // zero third origins) are unaffected and enforced by the privacy e2e.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${analytics}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob:`,
  `media-src 'self' data: blob:`,
  `font-src 'self' data:`,
  `connect-src 'self'${analytics}`,
  `worker-src 'self' blob:`,
  `object-src 'none'`,
  `base-uri 'none'`,
  `form-action 'none'`,
  `frame-ancestors 'none'`,
  // Dev needs eval for the react-refresh runtime; production keeps the strict policy.
  isDev ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'${analytics}` : "",
].join("; ");

// Every route is prerendered. Precache their HTML so a first visit that goes offline still opens them.
const ROUTES = ["/", "/app", "/app/tools", "/merge-pdf", "/split-pdf", "/compress-pdf", "/convert-pdf", "/sign-pdf", "/flows", "/done", "/settings", "/about", "/privacy", "/terms", "/pro"];
const BUILD_REV = String(Date.now());

const withSerwistInstance = withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  register: true,
  // Default is true: it would reload the page when the connection returns and wipe files the person is working on.
  reloadOnOnline: false,
  // Heavy engines (/gs, /pdfjs) are NOT precached; they are cached on first use or via the offline button.
  additionalPrecacheEntries: ROUTES.map((url) => ({ url, revision: BUILD_REV })),
  globPublicPatterns: ["*.svg", "fonts/**/*", "icons/**/*", "screenshots/**/*", "gs-worker.js"],
  // Serwist needs devDisable; in dev we skip the SW entirely so hot reload stays simple.
  disable: isDev,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Emscripten modules (gs.wasm glue) probe for node builtins at parse time;
  // in the browser we answer with empty stubs.
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      fs: false,
      module: false,
      path: false,
      util: false,
      crypto: false,
    };
    return config;
  },
  headers: async () => [
    {
      // The service worker must always be re-checked so updates reach people.
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
        { key: "Content-Security-Policy", value: csp },
      ],
    },
    {
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: csp },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ],
};

export default withSerwistInstance(nextConfig);
