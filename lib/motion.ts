/**
 * Motion tokens. Personality: soft, springy, a little weighty, like a plush toy.
 * Animate only transform + opacity. Springs: framer "motion" library.
 */
export const springs = {
  snappy: { stiffness: 420, damping: 28 },
  bouncy: { stiffness: 300, damping: 14 },
  soft: { stiffness: 180, damping: 22 },
  // Weightier settle used by big entries (Done headline, welcome arc)
  heavy: { stiffness: 140, damping: 18 },
} as const;

export const durations = {
  fast: 0.12,
  base: 0.22,
  slow: 0.42,
} as const;

export const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Page transition variant: fade + 16px upward slide, 220 ms. */
export const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.base, ease: easeOut },
  },
};

/** Simple appear used by cards/rows/FAQ entries. Fade + rise, spreadable on any motion element. */
export const riseIn = (y = 16) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration: durations.base, ease: easeOut },
});

export const staggerIn = (stagger = 0.08) => ({
  hidden: {},
  shown: { transition: { staggerChildren: stagger } },
});

/** Press feedback values (scale to 0.96, snappy release with overshoot) */
export const press = {
  whileTap: { scale: 0.96, transition: { type: "spring" as const, ...springs.snappy } },
};

/** Shake for errors: 4px, 3 cycles */
export const shakeKeyframes = {
  x: [0, -4, 4, -3, 3, -2, 2, 0],
  transition: { duration: 0.36, ease: "linear" as const },
};

export const confettiColors = ["#FF9F1C", "#FF6B2C", "#FFC9A0", "#B7CCFF", "#FFF1DC"] as const;
