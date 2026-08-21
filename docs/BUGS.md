# The 4 bugs, in depth

This is the detailed version of what the landing page shows you live. Each section covers: what causes the bug, what it looks like when it's broken, exactly how this kit prevents it, and — critically — how to avoid reintroducing it if you extend the kit.

---

## Bug 1: Scroll-triggered animations never fire

### The cause

Lenis replaces native scrolling with a virtual, smoothed one. It intercepts wheel/touch input and animates the scroll position itself, rather than letting the browser handle it directly. GSAP's ScrollTrigger, by default, calculates trigger positions and listens for scroll changes independently — it has no built-in awareness that Lenis exists.

Run Lenis and ScrollTrigger side by side with no explicit connection between them, and you get one of two failure modes:
- Animations that never fire at all (ScrollTrigger's internal scroll tracking falls out of sync with what's visually happening).
- Animations that fire at the wrong scroll position (drift accumulates between Lenis's virtual scroll value and ScrollTrigger's calculations).

Both are silent. No error, no console warning — the page just looks static below the fold.

### The fix

`src/animations/lenis/lenis.ts` does three things, all at initialization, so no individual section has to remember to do this itself:

```ts
lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);
```

1. Every Lenis scroll event explicitly tells ScrollTrigger to recalculate.
2. Lenis is driven by GSAP's own ticker (`autoRaf: false` on the Lenis instance) instead of running its own separate `requestAnimationFrame` loop — this keeps both systems on the exact same frame clock instead of two independent, potentially-drifting loops.
3. `lagSmoothing(0)` stops GSAP's own frame-skipping logic from fighting Lenis's easing.

### Where to see it fixed

- `src/animations/timelines/diff-reveal.ts` — the bug list and differentiator table reveal via `ScrollTrigger`-driven `clip-path` wipes.
- `src/animations/timelines/scroll-reveal.ts` — the generic section-reveal pattern used by `Section.astro`.

### The regression test

`tests/animations.spec.ts` checks that a below-the-fold element starts clipped (opacity/clip-path in its initial GSAP-set state) and becomes fully visible once scrolled into view — the exact thing that silently breaks if this sync is removed.

### If you add a new scroll-triggered animation

Route it through `sectionTriggerVars()` in `src/animations/utils/triggers.ts` rather than calling `ScrollTrigger.create()` directly. It returns `null` under `prefers-reduced-motion`, which every timeline in this kit checks before creating a trigger.

Also: any script that creates a `ScrollTrigger` should wait on `onSmoothScrollReady()` (exported from `lenis.ts`) before doing so. Component scripts execute in document order, and `initSmoothScroll()` is called at the very end of `<body>` — without this, a scroll-triggered animation defined earlier in the page could theoretically register before Lenis has finished initializing.

---

## Bug 2: Images that fade in as blank boxes

### The cause

A naive entrance animation does something like:

```ts
gsap.from(imageSelector, { opacity: 0, duration: 1 });
```

fired on `DOMContentLoaded`, component mount, or scroll-into-view. The problem: none of those events guarantee the image has actually finished downloading and decoding. If the animation starts before the image is ready, you get a smooth, well-eased fade-in of... nothing. The image pops in abruptly partway through, or after the animation has already finished.

### The fix

`src/animations/utils/image.ts` exports a single helper used everywhere an image needs to animate in:

```ts
export async function waitForImageLoad(img: HTMLImageElement | null): Promise<void> {
  if (!img) return;

  if (img.complete) {
    await img.decode?.().catch(() => undefined);
    return;
  }

  await new Promise<void>((resolve) => {
    img.addEventListener("load", () => resolve(), { once: true });
    img.addEventListener("error", () => resolve(), { once: true });
  });
}
```

Two things worth noting:
- `img.complete` can be `true` for a cached image that hasn't actually finished *decoding* yet on some browsers — so even in that branch, it still calls `.decode()`.
- It resolves on `error` too, not just `load`. A broken image shouldn't leave your entrance animation hanging forever.

### Where to see it fixed

- `src/animations/timelines/hero.ts` — the hero's entrance timeline `await`s this before running.
- `src/animations/timelines/carousel.ts` — the carousel doesn't reveal itself (`opacity: 0 → 1`) until the *first* slide's image has actually loaded. This is the one place in the kit where you can watch this fix do something visible: on a throttled connection, the carousel frame stays invisible for a beat longer than you'd expect from a naive implementation, specifically because it's waiting for real pixels, not just a fixed delay.

### If you add a new image animation

Import `waitForImageLoad` from `src/animations/utils/image.ts` rather than writing your own load-check. And use Astro's `<Image />` component (see `Carousel.astro` for the pattern) rather than a raw `<img>` — it handles responsive `srcset`/`sizes`, format conversion (the showcase screenshots ship as optimized WebP, not the original PNGs), and forces you to provide `alt` text, which also feeds Bug 4.

---

## Bug 3: Buttons that silently stop working

This one has two independent causes, and the kit fixes both.

### 3a: z-index conflicts from animated layers

### The cause

A decorative animated element (a glow, a background shape, a parallax layer) gets positioned near or over an interactive element. If its stacking context ends up above the button — even briefly, even by 1px — it intercepts the click. Nothing looks wrong; the button still renders normally. It just doesn't respond, and there's no visual cue as to why.

### The fix

Two things, together:

1. **A documented z-index scale** in `src/styles/tokens.css`:
   ```css
   --z-index-decorative: 0;
   --z-index-content: 10;
   --z-index-sticky: 40;
   --z-index-overlay: 60;
   ```
   Every layered element in the kit picks a rung from this scale (exposed as Tailwind utilities: `z-decorative`, `z-content`, `z-sticky`, `z-overlay`) instead of an arbitrary number. "Does this sit above or below that" is answerable by reading five lines of CSS, not by clicking around.

2. **`pointer-events: none` on every purely decorative layer**, as a second, independent line of defense — even if a future edit gets the z-index ordering wrong, a decorative element with `pointer-events: none` architecturally cannot intercept a click. Belt and suspenders.

### Where to see it fixed

`src/components/Bug3Proof.astro` — a decorative blurred shape animates on a loop, positioned to visually overlap a real button. Click through it; it always works. View source and you'll find `pointer-events-none` and `z-decorative` on the shape, `z-content` on the button.

### 3b: React island hydration races

### The cause

Astro's islands architecture ships a component's HTML immediately but defers hydrating it (attaching its actual event listeners) until later — `client:visible` specifically waits until the island scrolls into the viewport. That's good for performance, but it creates a real window: the button is visually present and looks clickable before its `onClick` handler has actually attached. A click that lands in that window is not delayed — it's dropped entirely. There's no queue; the DOM simply had no listener yet.

This is exactly the failure mode this kit's own test suite caught during development: a click test passed reliably in casual manual testing, then failed under real parallel test load (multiple browser contexts competing for CPU/network), because the hydration window widened just enough for the race to lose.

### The fix

`src/components/interactive/HydrationProofCounter.tsx` disables the button until an effect — which can only run after hydration completes — flips a `hydrated` state flag:

```tsx
const [hydrated, setHydrated] = useState(false);

useEffect(() => {
  setHydrated(true);
}, []);

// ...
<button disabled={!hydrated} ...>
  {hydrated ? "Click me" : "Loading…"}
</button>
```

This is the actual fix, not a workaround: instead of hoping a click lands after the listener attaches, the element is never presented as interactive until hydration has *verifiably* completed. Playwright's `.click()` (and real browsers' click handling generally) already waits for a disabled attribute to clear before proceeding — so consumers of the button get correct behavior for free, without needing to know any of this.

### If you add your own React island

- Default to `client:visible` or `client:idle` over `client:load` — only hydrate eagerly if the component is above the fold and needs to be interactive immediately (see `docs/ARCHITECTURE.md` for the full framework-minimalism rationale).
- If it's genuinely interactive (not just decorative), apply the same disabled-until-hydrated pattern. A `hydrated` boolean flipped in a mount-only `useEffect` is the whole pattern — no library needed.
- Most interactive elements in this kit (`CtaButton.astro`, the theme toggle, the carousel controls) are **not** React at all — they're plain Astro/HTML/vanilla JS, which sidesteps the hydration race entirely because there's no hydration step to race. Reach for React only when the interactivity genuinely requires component state that vanilla JS would make awkward.

---

## Bug 4: SEO / Lighthouse scores that don't hold up

### The cause

A handful of small, easy-to-forget omissions compound: no Open Graph or Twitter Card tags (so shared links show no preview image), missing or duplicated `<h1>`s, a heading hierarchy that skips levels because visual size was prioritized over semantic structure, images without `alt`, no sitemap, no `robots.txt`.

None of these break the page visually. They just quietly cap your Lighthouse SEO score and, more importantly, hurt how the page actually performs in search and when shared.

### The fix

- **Complete `<head>`** generated once in `src/layouts/Layout.astro` and reused by every page — title, meta description, canonical URL, full Open Graph and Twitter Card tags, all resolved to **absolute URLs** (a common mistake: `og:image` pointing at a relative path silently fails the Open Graph spec, which requires an absolute URL).
- **`site` configured in `astro.config.mjs`** — this is what lets Astro resolve those absolute URLs correctly. It ships as a placeholder (`https://example.com`) that you **must** replace with your real domain before deploying (see `docs/ARCHITECTURE.md#deployment`).
- **Sitemap** via `@astrojs/sitemap`, configured to exclude `/og-template` (a utility route used only to generate the OG preview image — not real content, and marked `noindex, nofollow` as a second safeguard).
- **`robots.txt`** in `public/`, pointing at the sitemap.
- **Semantic heading hierarchy** — one `<h1>` per page (the hero), `<h2>` per section, no skipped levels.
- **`alt` text required** by convention everywhere `<Image />` is used (see the Carousel component for the pattern).

### Where to see it fixed

View source on the live demo, or run:

```bash
npm run build
cat dist/sitemap-index.xml
cat dist/og-default.png  # (binary — just confirm it exists and isn't 0 bytes)
```

### If you add a new page

Every page needs to pass `title` and `description` to `Layout.astro`. Everything else (canonical URL, OG tags, sitemap inclusion) is automatic — that's the point of centralizing it in the layout instead of per-page.
