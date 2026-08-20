/**
 * Generic scroll-triggered reveal, used by content sections below the fold.
 * Relies on ScrollTrigger already being synced to Lenis in
 * src/animations/lenis/lenis.ts — this file doesn't need to know Lenis
 * exists, which is the point: the sync is a one-time setup cost, not
 * something every section has to re-solve.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, DURATION } from "../utils/easing";
import { sectionTriggerVars } from "../utils/triggers";

gsap.registerPlugin(ScrollTrigger);

export function revealOnScroll(selector: string): void {
  const el = document.querySelector(selector);
  if (!el) return;

  const scrollTrigger = sectionTriggerVars({ trigger: el as gsap.DOMTarget });

  if (!scrollTrigger) {
    // Reduced motion: show it, skip the animation entirely.
    gsap.set(el, { opacity: 1, y: 0 });
    return;
  }

  gsap.from(el, {
    opacity: 0,
    y: 32,
    duration: DURATION.base,
    ease: EASE.signature,
    scrollTrigger,
  });
}
