import { defineConfig, devices } from '@playwright/test';

// Runs the e2e specs against a deployed URL (a Netlify Deploy Preview), with no local server.
// The Netlify _headers policy only applies to deployed URLs, so this is the only place the CSP can be tested.
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
