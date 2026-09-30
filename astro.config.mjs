// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Origin only. Astro joins `site` + `base` itself, so including the base path
  // here made every canonical and sitemap URL come out as
  // /the-portfolio/the-portfolio/.
  site: 'https://the-coder-james.github.io',
  base: '/the-portfolio/', // subpath for GitHub Pages
  integrations: [
    react(),
    // One page, so the sitemap is small -- but it is what tells a crawler the
    // canonical address and when the page last changed, and robots.txt points
    // at it.
    sitemap({
      // The 404 is served, never indexed -- it has no business in the sitemap.
      filter: (page) => !page.includes('/404'),
    })
  ],
  vite: {
    plugins: [tailwindcss()]
  },
  outDir: './dist' // default, but explicit for clarity
});
