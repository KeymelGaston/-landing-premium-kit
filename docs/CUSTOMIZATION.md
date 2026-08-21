# Customization guide

Everything in this guide is safe to change without touching animation logic, the z-index system, or anything covered in `docs/ARCHITECTURE.md`. If you're not sure whether a change is "just content" or "architecture," check the list at the bottom of this file before editing.

---

## Colors

Every color in the kit is a CSS custom property in **`src/styles/tokens.css`**. Change the value there and it propagates everywhere — components reference the tokens (via Tailwind utilities like `bg-accent`, `text-muted`), never raw hex values.

```css
:root {
  --color-bg: #faf9f9;        /* light mode background ("paper") */
  --color-text: #16161a;
  --color-accent: #2f5eff;    /* the one accent color — used sparingly by design */
  --color-signature: #8a8d93; /* exclusive to the git-diff tags — don't reuse elsewhere */
  --color-border: #ececea;
  --color-muted: #6f6f74;
}

:root[data-theme="dark"] {
  --color-bg: #121212;        /* dark mode background ("void") */
  --color-text: #f2f2f0;
  --color-signature: #d6d9de;
  --color-border: #1e1e1e;
  --color-muted: #9a9a9d;
}
```

**One rule worth keeping**: `--color-signature` is deliberately used nowhere except the `Signature` component's git-diff tags. That exclusivity is what makes it read as a signature element instead of "another gray." If you introduce a second accent color, keep the same discipline — pick one thing it's for and don't reuse it for general UI.

If you change `--color-accent`, also regenerate the OG image (see [Updating the OG image](#updating-the-og-image) below) — it's a screenshot, not something that reads the token live.

---

## Typography

Also in `tokens.css`:

```css
--font-sans: "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", monospace;
```

To swap either font:

1. `npm install @fontsource/your-font-name` (or remove the fontsource packages entirely and link a different source).
2. Update the `@import` lines in `src/styles/global.css`.
3. Update the `--font-sans` / `--font-mono` values in `tokens.css`.
4. **Update the font preloads in `src/layouts/Layout.astro`** — the `<link rel="preload">` tags reference specific font files by weight. This step is what keeps Lighthouse Performance at 85 rather than dropping back toward the 75 it was before preloading was added — skipping it doesn't break anything visually, but it does quietly undo that optimization.

The type scale (heading sizes, line-height, letter-spacing) is also in `tokens.css` under `--text-*`, `--leading-*`, and `--tracking-*`. The kit deliberately uses one font family for everything — if you add a second, make sure it's a genuine editorial decision, not an automatic pairing.

---

## Copy and content

Text lives directly in the `.astro` component files as plain strings — there's no CMS or content collection in v1 (that's explicitly out of scope; see the original planning doc if you have it).

| What | File |
|---|---|
| Hero heading, subheading, CTA | `src/components/Hero.astro` |
| The 4 bugs list | `src/components/BugShowcase.astro` — the `bugs` array at the top |
| "Instead of saying / demonstrated by" table | `src/components/DifferentiatorTable.astro` — the `rows` array |
| Pricing, tier copy | `src/components/FinalCta.astro` |
| Footer tagline | `src/components/Footer.astro` |
| Page `<title>` and meta description | `src/pages/index.astro` — passed as props to `<Layout>` |

Editing any of these is plain content editing — no animation code lives in the same files as the copy it displays.

---

## Logo

The header currently uses text (`landing-premium-kit` in monospace) rather than an image logo — see `src/components/Header.astro`. To swap in an image:

```astro
<a href="/" class="...">
  <img src="/your-logo.svg" alt="Your Company" class="h-6" />
</a>
```

Put the file in `public/` (not `src/assets/`) if it doesn't need Astro's build-time optimization — a simple SVG logo usually doesn't. If it's a raster image, prefer `src/assets/` and Astro's `<Image />` component (see `src/components/Carousel.astro` for the pattern) so it gets optimized automatically.

---

## Updating the OG image

The social-preview image (`public/og-default.png`) is a **screenshot**, not something generated live from your tokens — so if you change the accent color, headline, or fonts, it goes stale.

`src/pages/og-template.astro` exists specifically to regenerate it. It's a hidden route (marked `noindex, nofollow`, not linked anywhere in the nav) that renders a 1200×630 card using your real tokens and fonts:

1. Run `npm run dev`.
2. Open `http://localhost:4321/og-template`.
3. Screenshot it at exactly 1200×630 (browser DevTools device toolbar, or any screenshot tool that supports precise dimensions).
4. Replace `public/og-default.png` with the new capture.

---

## Adding or removing sections

`src/pages/index.astro` is a flat list of section components:

```astro
<Header />
<main>
  <Hero />
  <BugShowcase />
  <ShowcaseSection />
  <DifferentiatorTable />
  <FinalCta />
</main>
<Footer />
```

Removing a section is as simple as deleting its line here. Adding one: build it as its own component in `src/components/` (one section = one file, matching every existing component), following the pattern already used — a `<Signature>` eyebrow, an `<h2>`, then content, wrapped in consistent `px-6 py-(--space-section) md:px-16` spacing.

If your new section needs a scroll-triggered reveal, see `docs/BUGS.md#bug-1-scroll-triggered-animations-never-fire` for how to hook into the existing sync rather than reinventing it.

---

## What's content vs. what's architecture

Safe to change freely (this file covers all of it):
- Colors, fonts, type scale values
- All copy and text content
- Pricing, support terms
- Logo
- Which sections appear and in what order

Read `docs/ARCHITECTURE.md` first before touching:
- Anything in `src/animations/` — these files are what keep the 4 bugs fixed; edits here can silently reintroduce one of them
- The z-index scale in `tokens.css` (`--z-index-*`) — it's small on purpose; read why before adding a sixth rung
- `src/animations/lenis/lenis.ts` — the Lenis ↔ ScrollTrigger sync
- `astro.config.mjs` — especially the `site` value, which several other things (sitemap, OG tags, canonical URLs) depend on
