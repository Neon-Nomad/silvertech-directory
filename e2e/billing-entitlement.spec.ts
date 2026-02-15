import { expect, test } from '@playwright/test';

test('billing entitlement codes map to specific CTAs', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('geo_prompt_dismissed', '1');
  });

  await page.goto('/__integrity', { waitUntil: 'domcontentloaded' });

  await page.getByTestId('err-slot-limit').click();
  await expect(page.getByTestId('error-code')).toContainText('ERR_SLOT_LIMIT');
  await expect(page.getByTestId('entitlement-cta')).toHaveText('Upgrade Plan');
  await expect(page.getByTestId('assign-plan-action')).toBeEnabled();
  await expect(page.getByTestId('upgrade-action')).toBeEnabled();

  await page.getByTestId('err-plan-restricted').click();
  await expect(page.getByTestId('error-code')).toContainText('ERR_PLAN_RESTRICTED');
  await expect(page.getByTestId('entitlement-cta')).toHaveText('View Plans');

  await page.getByTestId('err-pending-payment').click();
  await expect(page.getByTestId('error-code')).toContainText('ERR_PENDING_PAYMENT');
  await expect(page.getByTestId('entitlement-cta')).toHaveText('Go to Billing');
  await expect(page.getByTestId('assign-plan-action')).toBeDisabled();
  await expect(page.getByTestId('upgrade-action')).toBeDisabled();
});
