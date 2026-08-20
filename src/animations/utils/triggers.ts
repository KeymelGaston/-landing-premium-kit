/**
 * Shared ScrollTrigger defaults. Section timelines should build their
 * triggers through `sectionTrigger()` rather than calling ScrollTrigger.create
 * directly, so reduced-motion handling and start/end conventions stay
 * consistent across the whole site.
 */

import type { ScrollTrigger } from "gsap/ScrollTrigger";

export interface SectionTriggerOptions {
  trigger: gsap.DOMTarget;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  markers?: boolean;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Common ScrollTrigger config for a section reveal. Returns `null` when
 * the user prefers reduced motion — callers should skip creating the
 * animation entirely in that case (see timelines/hero.ts for the pattern),
 * rather than creating it and immediately disabling it.
 */
export function sectionTriggerVars(
  opts: SectionTriggerOptions
): ScrollTrigger.Vars | null {
  if (prefersReducedMotion()) return null;

  return {
    trigger: opts.trigger,
    start: opts.start ?? "top 80%",
    end: opts.end ?? "bottom 20%",
    scrub: opts.scrub ?? false,
    markers: opts.markers ?? false,
  };
}
