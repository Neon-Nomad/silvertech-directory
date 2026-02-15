import { expect, test } from '@playwright/test';

test('legacy dashboard tab redirects to canonical path with replace-safe flow', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('geo_prompt_dismissed', '1');
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/dashboard?tab=listings', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/operator\/login/);

  const url = new URL(page.url());
  const redirectTo = url.searchParams.get('redirect_to');
  expect(redirectTo).toBe('/dashboard/listings');

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});
