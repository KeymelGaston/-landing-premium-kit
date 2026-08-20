/**
 * Diff-reveal: staggers a list of "- before / + after" lines in with a
 * left-to-right clip-path wipe, so they read like a terminal printing a
 * git diff rather than a generic fade-up. This is the one motion flourish
 * the kit spends its "boldness budget" on — used only here and in the
 * differentiator table, both content that's genuinely diff-shaped.
 *
 * Respects prefers-reduced-motion by skipping straight to the end state
 * (see sectionTriggerVars, which returns null in that case).
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sectionTriggerVars } from "../utils/triggers";

gsap.registerPlugin(ScrollTrigger);

export function diffReveal(containerSelector: string, itemSelector: string): void {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const items = container.querySelectorAll(itemSelector);
  if (!items.length) return;

  const scrollTrigger = sectionTriggerVars({
    trigger: container as gsap.DOMTarget,
    start: "top 75%",
  });

  if (!scrollTrigger) {
    gsap.set(items, { clipPath: "inset(0 0 0 0)", opacity: 1 });
    return;
  }

  gsap.set(items, { clipPath: "inset(0 100% 0 0)", opacity: 1 });

  gsap.to(items, {
    clipPath: "inset(0 0% 0 0)",
    duration: 0.7,
    ease: "power2.out",
    stagger: 0.12,
    scrollTrigger,
  });
}
