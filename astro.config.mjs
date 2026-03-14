// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://alejandrejames.github.io/the-portfolio/', // full GitHub Pages URL
  base: '/the-portfolio/', // subpath for GitHub Pages
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false })
  ],
  build: {
    outDir: 'dist' // default, but explicit for clarity
  }
});