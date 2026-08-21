# Landing Premium Kit

A motion-design landing page template built with **Astro + GSAP + Lenis + TypeScript + Tailwind v4**, engineered around one idea: most creative starters look good in the demo and fall apart in production. This one doesn't, because the four bugs that usually cause that are fixed at the configuration level — not left for you to discover.

**[Live demo](https://landing-premium-kit.vercel.app)** — Lighthouse (mobile): Performance 85 · Accessibility 96 · Best Practices 100 · SEO 100

---

## Why this exists

Creative landing page starters built on Astro + GSAP + Lenis tend to break in the same four ways once you move past the demo:

1. **Scroll-triggered animations silently never fire** — Lenis replaces native scroll with a virtual one; if ScrollTrigger isn't explicitly synced to it, it never detects scroll at all.
2. **Images "fade in" as blank boxes** — a naive fade animates opacity before the browser finishes decoding the image.
3. **Buttons stop working with no visible cause** — z-index conflicts from animated layers, or React islands whose click listeners haven't attached yet, silently eat the click.
4. **SEO/Lighthouse scores that don't hold up** — incomplete `<head>`, broken heading hierarchy, images without `alt`, no sitemap.

Each one is fixed in this kit's base configuration, demonstrated live on the page itself (not just described in prose), and covered by an automated regression test. See **[docs/BUGS.md](./docs/BUGS.md)** for the full breakdown of each one — what causes it, what it looks like when it's broken, and exactly how this kit prevents it.

---

## Quickstart

```bash
npm install
npm run dev
```

Open `http://localhost:4321`. That's the whole setup — no environment variables, no external services required to run it locally.

To build for production:

```bash
npm run build
npm run preview   # sanity-check the production build locally before deploying
```

---

## Project structure

```
src/
  animations/
    lenis/lenis.ts          → Lenis ↔ ScrollTrigger sync (Bug 1 fix)
    timelines/               → one file per animated sequence — never a
                                shared animations.js grab-bag
    utils/                   → shared easing presets, trigger defaults,
                                the image-load-gate helper (Bug 2 fix),
                                the magnetic-hover utility
  components/                → Hero, BugShowcase, Carousel, etc. — one
                                Astro component per section
  components/interactive/    → the one deliberate React island in the
                                whole kit (see docs/ARCHITECTURE.md
                                for why it's here and nowhere else)
  layouts/Layout.astro       → the reusable <head> (Bug 4 fix), theme
                                bootstrap, mounts Lenis
  styles/
    tokens.css                → every design decision as a CSS custom
                                 property — color, type scale, spacing,
                                 the z-index scale (Bug 3 fix)
    global.css                → maps tokens.css into Tailwind v4's
                                 theme layer
  pages/index.astro           → assembles the sections
tests/                        → Playwright: one spec file per bug,
                                 plus responsive layout checks
```

For the reasoning behind this structure — why Astro, why Lenis over other smooth-scroll libraries, why the folder layout is shaped this way — see **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**.

---

## Customizing

Changing colors, copy, or the logo does **not** require touching the animation or layout code. See **[docs/CUSTOMIZATION.md](./docs/CUSTOMIZATION.md)** for the specific files to edit and what's safe to change versus what affects the architecture.

---

## Deploying

This is a fully static site — no server runtime required. It deploys to Vercel with zero configuration beyond one required step:

1. Push the repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) — Vercel auto-detects Astro.
3. **Before your first deploy**, update `site` in `astro.config.mjs` and the `Sitemap:` line in `public/robots.txt` to your real deployed domain. Without this, `og:image`, canonical links, and the sitemap all silently point at a placeholder.

Full deploy and git-workflow notes (including how to update the kit later without losing your customizations) are in **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md#deployment)**.

---

## Running the tests

```bash
npx playwright install   # one-time browser download
npx playwright test
```

14 tests across desktop Chromium and mobile Safari, covering all four bugs plus responsive layout. These aren't smoke tests — one of them (the hydration-race test for Bug 3) has already caught a real regression during this kit's own development. Treat a failing test as a real signal, not a flake to re-run past.

---

## Support

14 days of email support from purchase, up to 3 configuration requests. In scope: help getting the kit running, configuration questions, clarifying how something works. Out of scope: new features, custom design work, debugging code you've added on top of the kit.

Before reaching out about "the animations aren't working," check one thing first — it's the single most common false alarm:

```js
matchMedia('(prefers-reduced-motion: reduce)').matches
```

Run that in your browser console. If it returns `true`, the kit is working correctly — it's respecting your operating system's reduced-motion setting, which disables all animation on purpose. Toggle it off in your OS accessibility settings to see the motion.
