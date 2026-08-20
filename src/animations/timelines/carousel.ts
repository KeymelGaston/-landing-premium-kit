/**
 * Carousel controller: advances only on click (no autoplay — the user
 * drives it), sliding the track with GSAP. The initial reveal is gated on
 * the first slide's real image load event, same fix as the hero timeline
 * (see utils/image.ts) — this component exists specifically to prove Bug 2
 * against a real image, not just describe the fix in prose.
 */

import { gsap } from "gsap";
import { EASE, DURATION } from "../utils/easing";
import { prefersReducedMotion } from "../utils/triggers";
import { waitForImageLoad } from "../utils/image";

interface CarouselElements {
  root: HTMLElement;
  track: HTMLElement;
  slides: HTMLElement[];
  prevBtn: HTMLButtonElement | null;
  nextBtn: HTMLButtonElement | null;
  dots: HTMLButtonElement[];
}

function getElements(root: HTMLElement): CarouselElements | null {
  const track = root.querySelector<HTMLElement>("[data-carousel-track]");
  if (!track) return null;

  return {
    root,
    track,
    slides: Array.from(track.querySelectorAll<HTMLElement>("[data-carousel-slide]")),
    prevBtn: root.querySelector<HTMLButtonElement>("[data-carousel-prev]"),
    nextBtn: root.querySelector<HTMLButtonElement>("[data-carousel-next]"),
    dots: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-carousel-dot]")),
  };
}

export async function initCarousel(rootSelector: string): Promise<void> {
  const root = document.querySelector<HTMLElement>(rootSelector);
  if (!root) return;

  const els = getElements(root);
  if (!els || els.slides.length === 0) return;

  let index = 0;
  const reduced = prefersReducedMotion();

  function goTo(next: number) {
    index = (next + els!.slides.length) % els!.slides.length;

    gsap.to(els!.track, {
      xPercent: -100 * index,
      duration: reduced ? 0.01 : DURATION.slow,
      ease: EASE.entrance,
    });

    els!.dots.forEach((dot, i) => {
      dot.setAttribute("aria-current", i === index ? "true" : "false");
    });
    els!.slides.forEach((slide, i) => {
      slide.setAttribute("aria-hidden", i === index ? "false" : "true");
    });
  }

  els.prevBtn?.addEventListener("click", () => goTo(index - 1));
  els.nextBtn?.addEventListener("click", () => goTo(index + 1));
  els.dots.forEach((dot, i) => dot.addEventListener("click", () => goTo(i)));

  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") goTo(index + 1);
    if (e.key === "ArrowLeft") goTo(index - 1);
  });

  // Bug 2 in action: don't reveal the carousel until the first slide's
  // image has actually finished loading/decoding.
  const firstImage = els.slides[0]?.querySelector<HTMLImageElement>("img");
  await waitForImageLoad(firstImage ?? null);

  gsap.to(root, {
    opacity: 1,
    duration: reduced ? 0.01 : DURATION.base,
    ease: EASE.signature,
  });
}
