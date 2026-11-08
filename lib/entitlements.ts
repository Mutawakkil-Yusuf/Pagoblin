/**
 * Entitlements. V1: everything is free. Pro later unlocks batch, saved flows
 * beyond 3, OCR, Office conversion. Gate only: more than 3 saved flows.
 * isPro reads a local flag today; a real licence check plugs in with no call
 * site changes.
 */
export const FREE_FLOW_LIMIT = 3;

let proOverride: boolean | null = null;
if (typeof window !== "undefined") {
  try {
    const flag = new URLSearchParams(window.location.search).get("pro");
    if (flag === "1") proOverride = true;
    if (flag === "0") proOverride = false;
  } catch {
    /* ignore */
  }
}

export function isPro(): boolean {
  return proOverride ?? false;
}

export const proFeatures = [
  "Batch process dozens of files",
  "Save and rerun your flows",
  "OCR and table extraction",
  "Word and PowerPoint, soon",
] as const;

export const waitlistUrl =
  process.env.NEXT_PUBLIC_WAITLIST_URL || "";
