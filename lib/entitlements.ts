/**
 * Entitlements. V1: everything is free, including batch processing and OCR.
 * Pro is not for sale and only lists future extras (more saved flows beyond
 * the free three, and Office conversion when a server-backed path exists).
 * A real licence check plugs in here with no call-site changes.
 */
export const FREE_FLOW_LIMIT = 3;

export function isPro(): boolean {
  // No licence exists yet, and no query-string flag may unlock one: a URL
  // parameter is not a purchase and must not change what the app offers.
  return false;
}

export const proFeatures = [
  "More saved flows on this device",
  "Word and PowerPoint, when it is ready",
  "A way to support the project",
] as const;

export const waitlistUrl =
  process.env.NEXT_PUBLIC_WAITLIST_URL || "";
