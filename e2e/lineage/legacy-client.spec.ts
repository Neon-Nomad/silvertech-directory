import { expect, test } from '@playwright/test';
import { accounts, assertIsolatedStack, blockExternal, bodyText, openVault, signIn } from './helpers';

// Compatibility checks for the previously deployed client, which reads the view directly.
// LINEAGE_STAGE=before-revoke: the view is still granted, so the old client loads (and still shows every facility).
// LINEAGE_STAGE=after-revoke: the view grant is removed, so the old client shows a permission error.
const stage = process.env.LINEAGE_STAGE ?? 'before-revoke';

test.beforeAll(async () => {
  await assertIsolatedStack();
});

test(`previously deployed client at stage ${stage}`, async ({ page }) => {
  await blockExternal(page);
  await signIn(page, accounts.operator1, '/operator/login');
  await page.waitForURL(/\/dashboard/);
  await openVault(page);
  if (stage === 'before-revoke') {
    await expect(page.getByTestId('lineage-row-count')).toHaveText('3');
  } else {
    await expect(page.getByText(/permission denied for view api_internal_facility_lineage/)).toBeVisible();
    await expect(page.getByTestId('lineage-row-count')).toHaveText('0');
  }
  const text = await bodyText(page);
  expect(text).not.toMatch(/SECRET_PAYLOAD/);
});
