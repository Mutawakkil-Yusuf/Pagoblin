/**
 * One Content-Security-Policy for the app and the proof page. Keeping the
 * string here means the page cannot drift from the header that is actually
 * sent by next.config.ts.
 */
export type CspOptions = {
  /** Dev needs eval for the React refresh runtime; production does not. */
  dev?: boolean;
  /** Optional analytics origin. Empty in the default build. */
  analyticsHost?: string;
};

export function buildCsp(opts: CspOptions = {}): string {
  const analytics = opts.analyticsHost ? ` ${opts.analyticsHost}` : "";
  const scriptSrc = opts.dev
    ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'${analytics}`
    : `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${analytics}`;

  return [
    `default-src 'self'`,
    // 'wasm-unsafe-eval' instantiates the Emscripten engines in workers.
    // 'unsafe-inline' is required by the App Router's inline RSC bootstrap
    // scripts. There is no server-rendered user data, so the reachable XSS
    // surface stays nil; the hard guarantee is connect-src 'self'.
    scriptSrc,
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
  ].join("; ");
}
