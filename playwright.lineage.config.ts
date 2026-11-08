import { defineConfig, devices } from '@playwright/test';

// Browser tests for the operator Vault against an isolated local Supabase stack (never production).
// Start the app first, pointed at the isolated stack, e.g.:
//   VITE_SUPABASE_URL=http://127.0.0.1:56321 VITE_SUPABASE_ANON_KEY=<local anon key> npx vite --port 5173 --strictPort
export default defineConfig({
  testDir: './e2e/lineage',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.LINEAGE_APP_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
