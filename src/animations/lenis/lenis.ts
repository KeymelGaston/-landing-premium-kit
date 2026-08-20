/**
 * Smooth scroll setup (Lenis) synced with GSAP ScrollTrigger.
 *
 * === Bug 1 this file resolves ===
 * Lenis replaces native scrolling with a virtual/smoothed scroll. If
 * ScrollTrigger isn't explicitly told about Lenis's scroll events, it
 * keeps listening to the native scroll (which never fires the way Lenis
 * moves things), so scroll-triggered animations silently never start.
 *
 * The fix has three parts, all handled here so nobody building a new
 * section has to remember to wire this up themselves:
 *   1. Lenis's own raf loop is disabled (`autoRaf: false`) and driven by
 *      GSAP's ticker instead, so both stay on the same frame clock.
 *   2. `lenis.on('scroll', ScrollTrigger.update)` tells ScrollTrigger to
 *      recompute on every Lenis scroll tick.
 *   3. `gsap.ticker.lagSmoothing(0)` avoids ScrollTrigger's own frame
 *      skipping fighting with Lenis's easing.
 *
 * Call `initSmoothScroll()` once, from a top-level script (see Layout.astro).
 */

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;
let isReady = false;
const readyCallbacks: Array<(lenis: Lenis | null) => void> = [];

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Registers a callback for when smooth-scroll init has resolved (whether
 * that resulted in a live Lenis instance or `null` for reduced motion).
 * Safe to call before OR after `initSmoothScroll()` runs — solves the
 * script-ordering problem where a component's own script (e.g.
 * ScrollProgress.astro) executes earlier in the document than the layout's
 * `initSmoothScroll()` call at the end of <body>.
 */
export function onSmoothScrollReady(callback: (lenis: Lenis | null) => void): void {
  if (isReady) {
    callback(lenisInstance);
  } else {
    readyCallbacks.push(callback);
  }
}

/**
 * Initializes Lenis and wires it into GSAP's ticker + ScrollTrigger.
 * Safe to call once per page load. Returns the Lenis instance, or null
 * if smooth scroll is skipped (reduced-motion users get native scroll,
 * which is not a degraded experience — it's the correct one for them).
 */
export function initSmoothScroll(): Lenis | null {
  if (typeof window === "undefined") return null;

  // A section's ScrollTrigger start position is computed from the DOM at
  // creation time. Self-hosted webfonts swap in after that (FOUT), which
  // can reflow text enough to shift trigger positions — so once fonts
  // settle, recalculate. Harmless no-op if nothing shifted.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  if (prefersReducedMotion()) {
    // Native scroll is left completely untouched. ScrollTrigger still
    // works out of the box against native scroll in this case.
    isReady = true;
    readyCallbacks.splice(0).forEach((cb) => cb(null));
    return null;
  }

  if (lenisInstance) return lenisInstance;

  const lenis = new Lenis({
    autoRaf: false,
    // Slightly gentler default than Lenis's stock preset — tuned to feel
    // controlled rather than "floaty" on a content-heavy landing page.
    duration: 1.1,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  });

  // (1) Tell ScrollTrigger to recompute on every Lenis scroll event.
  lenis.on("scroll", ScrollTrigger.update);

  // (2) Drive Lenis from GSAP's ticker instead of its own rAF loop, so
  // both are perfectly frame-synced.
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  // (3) Prevent GSAP's lag-smoothing from fighting Lenis's own easing.
  gsap.ticker.lagSmoothing(0);

  lenisInstance = lenis;
  isReady = true;
  readyCallbacks.splice(0).forEach((cb) => cb(lenisInstance));
  return lenis;
}

/** Returns the active Lenis instance, if smooth scroll is running. */
export function getLenis(): Lenis | null {
  return lenisInstance;
}

/** Tears down Lenis and detaches it from GSAP's ticker. Used in tests/HMR. */
export function destroySmoothScroll(): void {
  if (!lenisInstance) return;
  lenisInstance.destroy();
  lenisInstance = null;
}
