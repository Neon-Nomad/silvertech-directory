import { expect, test } from '@playwright/test';

// Runs against a Netlify Deploy Preview (BASE_URL), where the published _headers policy applies.
// The local dev server does not apply _headers, so it cannot prove this repair.
const BASE = process.env.BASE_URL ?? 'https://silvertechdirectory.com';
const FACILITY = '/assisted-living/minnesota/minneapolis/hope-wellness-center-inc-1127636603/';
// Netlify's deploy-preview toolbar frames app.netlify.com; production never does. Ignored on preview hosts only.
const isNetlifyPreview = /netlify\.app/.test(BASE);

test.describe('facility page family actions', () => {
  test('islands hydrate, actions render, and no CSP violations are logged', async ({ page }) => {
    const violations: string[] = [];
    page.on('console', (m) => {
      if (!/Content Security Policy/.test(m.text())) return;
      if (isNetlifyPreview && /app\.netlify\.com/.test(m.text())) return;
      violations.push(m.text());
    });
    await page.goto(BASE + FACILITY, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('astro-island[ssr]')).toHaveCount(0, { timeout: 20000 });
    await expect(page.getByText('Get your free tour prep guide')).toBeAttached({ timeout: 20000 });
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible({ timeout: 20000 });
    expect(violations).toEqual([]);
  });

  test('Google Tag Manager loads without a CSP block', async ({ page }) => {
    const gtm = page.waitForResponse((r) => r.url().startsWith('https://www.googletagmanager.com/gtag/js'), { timeout: 30000 });
    await page.goto(BASE + FACILITY, { waitUntil: 'domcontentloaded' });
    expect((await gtm).ok()).toBeTruthy();
  });

  test('the Public Sans font applies on static directory pages', async ({ page }) => {
    await page.goto(BASE + FACILITY, { waitUntil: 'load' });
    const media = await page.locator('link[data-font-onload]').first().evaluate((el: HTMLLinkElement) => el.media);
    expect(media).toBe('all');
  });
});
