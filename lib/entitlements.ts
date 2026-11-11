/**
 * Entitlements. V1: everything is free, including batch processing and OCR.
 *
 * Phase 3 is distribution-first: Pro is not for sale, there is no checkout and
 * no tool is gated. The planned Pro licence is a one-time offline key for
 * future extras (a native desktop app and Teams self-hosting), not a
 * subscription and not an account wall. A real licence check plugs in here
 * with no call-site changes.
 */
export const FREE_FLOW_LIMIT = 3;

export function isPro(): boolean {
  // No licence exists yet, and no query-string flag may unlock one: a URL
  // parameter is not a purchase and must not change what the app offers.
  return false;
}

export const proFeatures = [
  "Native desktop app, when it is ready",
  "Teams self-hosting, when it is ready",
  "More saved flows on this device",
  "A way to support the project",
] as const;

export const waitlistUrl =
  process.env.NEXT_PUBLIC_WAITLIST_URL || "";
