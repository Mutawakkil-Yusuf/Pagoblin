/** Haptics, toggleable: taps 10 ms, success [20,40,20], errors [30,60]. */
import { useSettings } from "./store/settings";

export function haptic(pattern: "tap" | "success" | "error") {
  if (typeof window === "undefined") return;
  if (useSettings.getState().haptics === false) return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (!nav.vibrate) return;
  try {
    nav.vibrate(pattern === "tap" ? 10 : pattern === "success" ? [20, 40, 20] : [30, 60]);
  } catch {
    /* ignore */
  }
}
