import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

// Astro's client build exposes only PUBLIC_ variables, so the islands could not read the
// VITE_SUPABASE_* values that the single-page build uses. Define only those two (both are public
// by design, and the single-page bundle already ships them). Other VITE_ values stay out of the bundle.
const supabaseEnv = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), 'VITE_SUPABASE');

export default defineConfig({
  site: 'https://silvertechdirectory.com',
  srcDir: './astro-src',
  outDir: './dist-astro',
  publicDir: './public',
  integrations: [react(), sitemap()],
  vite: {
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseEnv.VITE_SUPABASE_URL ?? ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseEnv.VITE_SUPABASE_ANON_KEY ?? ''),
    },
    ssr: {
      noExternal: ['leaflet', 'leaflet.markercluster']
    }
  }
});
