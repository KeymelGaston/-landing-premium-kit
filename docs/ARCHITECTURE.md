# Architecture

The "why" behind the big decisions — for whoever picks this project up later, whether that's future-you or a developer you hire. Customization questions belong in `docs/CUSTOMIZATION.md`; this file is for questions that start with "why is it built this way" rather than "how do I change X."

---

## Why Astro

Three reasons, in order of how much they actually matter for a landing page:

1. **Zero JS by default.** Astro ships HTML/CSS with no JavaScript runtime unless a component explicitly opts into hydration. For a marketing page where most of the interactivity is either scroll-driven (handled by GSAP/Lenis, not component state) or trivially simple (a button, a toggle), this means the JS payload stays close to what the animation libraries themselves cost — not inflated by a full framework runtime for content that's fundamentally static.
2. **Islands architecture** makes "use React only where it's genuinely justified" an enforced pattern, not just a guideline. See [Framework minimalism](#framework-minimalism-why-theres-exactly-one-react-component) below.
3. **Content-first templating** (`.astro` files) is a better fit than JSX/Vue SFCs for a project that's mostly markup and copy with animation hooks attached, not application state.

## Why Lenis over other smooth-scroll libraries

Locomotive Scroll was the other realistic option. Lenis won on:
- Smaller bundle size (relevant directly to the Lighthouse Performance score).
- A simpler, well-documented GSAP integration path (the `lenis.raf()` + `gsap.ticker` pattern used in `src/animations/lenis/lenis.ts` is closer to Lenis's own recommended usage than Locomotive's).
- Active maintenance — Locomotive Scroll's GSAP-specific documentation had gone stale at the time this kit was built.

Plain CSS `scroll-behavior: smooth` was considered and rejected: it doesn't give ScrollTrigger anything to sync against, and offers none of the easing control that makes the scroll feel deliberate rather than just less abrupt.

## Why GSAP over Framer Motion / native Web Animations API

GSAP's `ScrollTrigger` plugin is the actual reason — it's the most mature scroll-triggered-animation tooling available, and Lenis's own documentation is written assuming GSAP as the animation layer. Framer Motion is React-only, which would have forced the "use React everywhere" pattern this kit specifically argues against (see below).

## Why Tailwind v4

The CSS-first configuration (`@theme` blocks in `global.css` rather than a JS config file) maps naturally onto `tokens.css` being the actual single source of truth — every design token is a CSS custom property that both Tailwind's utility generation *and* any hand-written CSS in the kit can reference identically. There's no second, JS-side copy of the color palette to keep in sync.

**One real scar from this decision, worth documenting**: Tailwind v4 auto-generates utilities from any theme namespace you define. Early in this kit's development, a custom spacing scale was mapped into the `--spacing-*` namespace using names like `xl`, `2xl` — which collided with Tailwind's *own* built-in named scale for `max-w-*`, `text-*`, and similar utilities. `max-w-xl` silently started resolving to a custom `4rem` value instead of Tailwind's built-in `36rem`, breaking layout width across the whole site in a way that wasn't obvious until measured. The fix was removing that mapping and referencing spacing tokens via arbitrary-value syntax (`py-(--space-section)`) instead of exposing them as named utilities. If you extend the token system, avoid `xs`/`sm`/`md`/`lg`/`xl`/`2xl`/`3xl` as custom namespace keys — those are reserved by Tailwind's own scale.

## Folder structure

```
src/
  animations/
    lenis/       → the one sync point everything else depends on
    timelines/   → one file per animated sequence
    utils/       → shared, tested-by-reuse helpers (easing, triggers, image-load gating, magnetic hover)
  components/    → one section = one file
  components/interactive/  → isolates the kit's one React component
  layouts/
  styles/        → tokens.css (source of truth) + global.css (Tailwind wiring)
  pages/
```

The split between `animations/timelines/` and `animations/utils/` is deliberate: timelines are one-off sequences tied to a specific section (hero entrance, carousel slide transition); utils are the pieces meant to be reused across multiple timelines (the image-load gate, the shared easing presets, the reduced-motion check). If you find yourself copy-pasting logic between two timeline files, that's the signal it belongs in `utils/` instead.

## The z-index scale

Five values, documented in `tokens.css`, covering the entire kit:

```css
--z-index-decorative: 0;
--z-index-content: 10;
--z-index-sticky: 40;
--z-index-overlay: 60;
```

This is intentionally small. A z-index scale that grows without discipline (arbitrary 9999s scattered through a codebase) is exactly the failure mode Bug 3 describes. If you need a sixth rung, that's a legitimate reason to add one — but add it to this list with a comment explaining what layer it's for, rather than reaching for an arbitrary number in a single component.

## Framework minimalism — why there's exactly one React component

`src/components/interactive/HydrationProofCounter.tsx` is the **only** React in this entire kit. Every other interactive element — the theme toggle, the carousel's prev/next controls, the CTA buttons, the magnetic hover effect — is plain Astro markup with a vanilla `<script>` tag.

This isn't an accident or an oversight; it's the position the kit takes: reach for a framework only when the interactivity genuinely requires component state that vanilla JS would make awkward to manage. A button, an accordion, a carousel's slide index — none of these need React. They need an event listener and maybe a few lines of state held in a closure.

The one React component exists specifically to *demonstrate* Bug 3's hydration-race problem and its fix (see `docs/BUGS.md`) — it's a teaching artifact as much as a UI element. If you're extending this kit and reaching for React for a new piece of UI, ask first whether it actually needs component-level state, or whether it's "a button or an accordion" in disguise. The doc that originally scoped this kit is explicit about this exact trap: *"a common mistake is adding a heavy framework for interactivity across the whole site, including simple things like a button or accordion — it adds unnecessary JS to the bundle, slows Time to Interactive, and complicates maintenance without real need."*

---

## Deployment

The kit builds to fully static output — no server runtime, no serverless functions required for anything currently in it. The `@astrojs/vercel` adapter is installed, but it's not converting anything to server-rendered; it's there purely to opt into Vercel-specific static optimizations (their image service, analytics hooks) if you want them later.

### First deploy checklist

1. **`astro.config.mjs`** — set `site` to your real deployed domain. Everything downstream (canonical URLs, `og:image`, the sitemap) resolves against this value; leaving the placeholder means those all silently point at `https://example.com`.
2. **`public/robots.txt`** — the `Sitemap:` line must match the same domain.
3. Push to GitHub, import the repo at [vercel.com/new](https://vercel.com/new). Vercel auto-detects Astro; no build command overrides needed.
4. After the first deploy, verify `og:image` resolves correctly: view source on the deployed URL and confirm the `og:image` meta tag shows your real domain, not the placeholder. (This exact mistake happened during this kit's own deployment — the domain fix was committed and pushed, GitHub showed it correctly, but the live site kept serving the old value due to CDN caching for a few minutes. If you see stale values right after a deploy, wait a few minutes and hard-refresh in an incognito window before assuming something's broken.)

### Git workflow

Because this is a purchased template rather than a library you install via npm, there's no formal "pull updates from upstream" mechanism — you own a full copy of the code from day one. Practical guidance for keeping things manageable:

- **Commit your customizations normally.** There's nothing special to configure; the `.gitignore` already excludes `node_modules/`, `dist/`, and `.vercel/`.
- **If a future version of this kit is released** and you want to selectively bring in a fix (say, an improvement to one of the four bug fixes) without losing your own customizations: the animation and architecture files listed in `docs/CUSTOMIZATION.md`'s "read this first" section are the ones most likely to change between versions. Diff those specific files against the new release rather than merging wholesale.
- **Before making a large customization** (a new section, a significant redesign), commit the working state first. Every commit is a restore point — use them.

### Running the test suite before deploying

```bash
npx playwright install   # first time only
npx playwright test
```

Treat a red test as real signal. This kit's own test suite caught a genuine hydration-race regression during development — a change that looked correct in casual manual testing failed reliably under real parallel test load. Re-running a failing test hoping it passes the second time defeats the entire point of having it.
