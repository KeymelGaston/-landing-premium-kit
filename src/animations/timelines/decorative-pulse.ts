/**
 * Purely decorative motion for the Bug 3 proof's background glow. Kept in
 * its own tiny timeline because decorative layers should never share a
 * file with anything that matters functionally — makes it obvious at a
 * glance that nothing here is load-bearing.
 */

import { gsap } from "gsap";
import { prefersReducedMotion } from "../utils/triggers";

export function pulseDecorative(selector: string): void {
  if (prefersReducedMotion()) return;

  gsap.to(selector, {
    scale: 1.2,
    x: 24,
    duration: 2.4,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
}
