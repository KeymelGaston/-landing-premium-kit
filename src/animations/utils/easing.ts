/**
 * Shared easing presets. Import these instead of hardcoding ease strings
 * in individual timelines — keeps motion consistent across sections and
 * makes it a one-line change to retune the whole site's feel.
 */

export const EASE = {
  /** Default for most reveals — confident settle, no bounce. */
  signature: "power3.out",
  /** For elements entering with more weight (hero, section transitions). */
  entrance: "power4.out",
  /** For subtle hover/micro-interactions. */
  micro: "power1.inOut",
  /** For anything that should feel mechanical/precise (the git-diff tags). */
  linear: "none",
} as const;

export const DURATION = {
  fast: 0.3,
  base: 0.6,
  slow: 1,
} as const;
