import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    server: {
      port: 5173,
      host: '0.0.0.0',
      hmr: {
        clientPort: 5173,
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('react')) {
              return 'react';
            }
            if (id.includes('@supabase') || id.includes('supabase')) {
              return 'supabase';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'maps';
            }
            if (id.includes('@stripe') || id.includes('/stripe')) {
              return 'stripe';
            }
            if (id.includes('framer-motion') || id.includes('gsap')) {
              return 'motion';
            }
            if (id.includes('react-helmet-async') || id.includes('react-markdown')) {
              return 'content';
            }
            return 'vendor';
          }
        }
      }
    }
  };
});
