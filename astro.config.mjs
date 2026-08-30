// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://alejandrejames.github.io/the-portfolio/', // full GitHub Pages URL
  base: '/the-portfolio/', // subpath for GitHub Pages
  integrations: [
    react()
  ],
  vite: {
    plugins: [tailwindcss()]
  },
  outDir: './dist' // default, but explicit for clarity
});
