import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://silvertechdirectory.com',
  srcDir: './astro-src',
  outDir: './dist-astro',
  publicDir: './public',
  integrations: [react(), sitemap()],
  vite: {
    ssr: {
      noExternal: ['leaflet', 'leaflet.markercluster']
    }
  }
});
