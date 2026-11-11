import type { NextConfig } from "next";
import withSerwist from "@serwist/next";
import { buildCsp } from "./lib/csp";

const isDev = process.env.NODE_ENV === "development";

// Analytics host is optional and only wired when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set.
const plausibleHost = process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || "https://plausible.io";
const analyticsHost = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? plausibleHost : "";

// connect-src stays 'self' (+ optional analytics). File bytes can never leave
// the device; the privacy e2e test enforces this at runtime. The proof page
// imports the same builder, so the policy it displays is the policy we send.
const csp = buildCsp({ dev: isDev, analyticsHost });

// Every route is prerendered. Precache their HTML so a first visit that goes offline still opens them.
const ROUTES = [
  "/",
  "/app",
  "/app/tools",
  "/merge-pdf",
  "/split-pdf",
  "/organize-pdf",
  "/compress-pdf",
  "/compress-pdf-to-2mb",
  "/convert-pdf",
  "/pdf-to-jpg",
  "/jpg-to-pdf",
  "/pdf-to-text",
  "/sign-pdf",
  "/protect-pdf",
  "/pdf-metadata",
  "/sanitize-pdf",
  "/verify-pdf",
  "/redact-pdf",
  "/form-pdf",
  "/ocr-pdf",
  "/batch-pdf",
  "/proof",
  "/flows",
  "/done",
  "/settings",
  "/about",
  "/privacy",
  "/terms",
  "/pro",
  "/share",
];
const BUILD_REV = String(Date.now());

// Small public assets that make the installed app feel complete offline. Heavy
// engines (/gs, /pdfjs, /qpdf, /ocr) are deliberately absent: they are cached
// on first use or by Settings → Work offline, not on every first visit.
const PUBLIC_ASSETS = [
  "/favicon.svg",
  "/logo-lockup.svg",
  "/manifest.webmanifest",
  "/build-manifest.json",
  "/gs-worker.js",
  "/qpdf-worker.js",
  "/ocr/worker.min.js",
  "/fonts/bricolage-latin.woff2",
  "/fonts/bricolage-latin-ext.woff2",
  "/fonts/bricolage-vietnamese.woff2",
  "/fonts/dmsans-latin.woff2",
  "/fonts/dmsans-latin-ext.woff2",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-64.png",
  "/screenshots/phone-home.png",
  "/screenshots/phone-compress.png",
  "/screenshots/desktop-home.png",
  "/screenshots/desktop-tools.png",
];

const withSerwistInstance = withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  register: true,
  // Default is true: it would reload the page when the connection returns and wipe files the person is working on.
  reloadOnOnline: false,
  // Heavy engines (/gs, /pdfjs, /qpdf, /ocr) are NOT precached; they are cached on first use or via the offline button.
  additionalPrecacheEntries: [...ROUTES, ...PUBLIC_ASSETS].map((url) => ({ url, revision: BUILD_REV })),
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
