/**
 * Hero entrance timeline.
 *
 * === Bug 2 this file demonstrates the fix for ===
 * A naive fade-in animates `opacity` on page load, but if it targets an
 * <img> and the browser hasn't finished decoding it yet, the element
 * "fades in" while still blank — it looks like a broken image, not a bug
 * in the animation. The fix is to gate the reveal on the image's real
 * load state (`complete` + decode()), not on DOMContentLoaded/mount.
 */

import { gsap } from "gsap";
import { EASE, DURATION } from "../utils/easing";
import { prefersReducedMotion } from "../utils/triggers";
import { waitForImageLoad } from "../utils/image";

interface HeroTimelineTargets {
  heading: string;
  subheading: string;
  cta: string;
  image?: string;
}

async function waitForImage(selector?: string): Promise<void> {
  if (!selector) return;
  const img = document.querySelector<HTMLImageElement>(selector);
  await waitForImageLoad(img);
}

export async function playHeroTimeline(targets: HeroTimelineTargets): Promise<void> {
  await waitForImage(targets.image);

  if (prefersReducedMotion()) {
    // Snap everything to its final, visible state — no motion, no hidden content.
    gsap.set([targets.heading, targets.subheading, targets.cta, targets.image].filter(Boolean), {
      opacity: 1,
      y: 0,
    });
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: EASE.entrance } });

  tl.from(targets.heading, { opacity: 0, y: 24, duration: DURATION.slow })
    .from(targets.subheading, { opacity: 0, y: 16, duration: DURATION.base }, "-=0.5")
    .from(targets.cta, { opacity: 0, y: 12, duration: DURATION.base }, "-=0.4");

  if (targets.image) {
    tl.from(targets.image, { opacity: 0, scale: 1.03, duration: DURATION.slow }, 0);
  }
}
