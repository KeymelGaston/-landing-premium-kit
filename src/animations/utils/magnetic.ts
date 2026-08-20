/**
 * Magnetic hover for CTAs: the button pulls slightly toward the cursor
 * within its own bounds. Used sparingly — one primary CTA per view — so it
 * reads as a deliberate flourish, not a site-wide gimmick.
 *
 * Skipped entirely for touch input (no hover concept) and reduced-motion
 * users, both of whom get the button's normal static state.
 */

import { gsap } from "gsap";

export function magnetize(el: HTMLElement, strength = 0.35): () => void {
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!canHover || reducedMotion) return () => {};

  const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
  const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

  function onMove(e: PointerEvent) {
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    xTo(relX * strength);
    yTo(relY * strength);
  }

  function onLeave() {
    xTo(0);
    yTo(0);
  }

  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", onLeave);

  return () => {
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", onLeave);
  };
}
