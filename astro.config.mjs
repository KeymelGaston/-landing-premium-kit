// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // REQUIRED before deploying: replace with the kit's real deployed domain.
  // Astro needs this to resolve absolute URLs for og:image, canonical links,
  // and the sitemap — without it, social previews silently break.
  site: 'https://landing-premium-kit.vercel.app',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    react(),
    sitemap({
      // /og-template is a hidden utility route (used to generate the OG
      // image), not a real page — it's already noindexed, but keep it out
      // of the sitemap too so crawlers never see it listed at all.
      filter: (page) => !page.includes('/og-template'),
    }),
  ],

  adapter: vercel()
});