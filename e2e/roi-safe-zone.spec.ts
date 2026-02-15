import { expect, test } from '@playwright/test';

test('ROI safe-zone warning appears only outside safe range', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('geo_prompt_dismissed', '1');
  });

  await page.goto('/__integrity', { waitUntil: 'domcontentloaded' });

  const slider = page.getByTestId('baseline-slider');
  await expect(slider).toBeVisible();

  await slider.fill('12');
  await expect(page.getByTestId('baseline-value')).toHaveText('12.0%');
  await expect(page.getByTestId('safe-zone-warning')).toHaveCount(0);

  await slider.fill('18');
  await expect(page.getByTestId('baseline-value')).toHaveText('18.0%');
  await expect(page.getByTestId('safe-zone-warning')).toBeVisible();
  await expect(page.getByTestId('safe-zone-warning')).toHaveClass(/bg-amber-50/);
});
