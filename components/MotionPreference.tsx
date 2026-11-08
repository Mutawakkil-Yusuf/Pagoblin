"use client";

import { MotionConfig, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { useSettings, type MotionSetting } from "@/lib/store/settings";

/**
 * Motion preference wiring: the in-app setting (system/on/off) on top of
 * prefers-reduced-motion. Reduced mode drops idle loops, floats, tilts,
 * confetti and parallax, and keeps 120 ms fades.
 */
export function MotionPreference({ children }: { children: ReactNode }) {
  const motion = useSettings((s) => s.motion);
  const systemReduced = useReducedMotion();
  const reduced = motion === "off" || (motion === "system" && systemReduced === true);

  // Also expose the effective setting to CSS so non-framer bits (skeleton shimmer,
  // marching dash) respect it.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("pg-reduced", reduced);
    return () => root.classList.remove("pg-reduced");
  }, [reduced]);

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"} transition={{ duration: 0.22 }}>
      {children}
    </MotionConfig>
  );
}

export function usePrefersReduced(): boolean {
  const motion = useSettings((s) => s.motion);
  const systemReduced = useReducedMotion();
  return motion === "off" || (motion === "system" && systemReduced === true);
}
