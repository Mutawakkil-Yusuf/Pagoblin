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
  // 'wasm-unsafe-eval' is required to instantiate Emscripten/JS engines (Ghostscript WASM) in workers.
  `script-src 'self' 'wasm-unsafe-eval'${analytics}`,
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
  isDev ? `script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'${analytics}` : "",
].join("; ");

const withSerwistInstance = withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  register: true,
  // Serwist needs devDisable; in dev we skip the SW entirely so hot reload stays simple.
  disable: isDev,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  headers: async () => [
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
