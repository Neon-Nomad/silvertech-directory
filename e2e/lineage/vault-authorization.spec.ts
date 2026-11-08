import { expect, test } from '@playwright/test';
import { accounts, APP, assertIsolatedStack, blockExternal, bodyText, dismissPrompts, openVault, readDownload, signIn, waitForSession } from './helpers';

test.beforeAll(async () => {
  await assertIsolatedStack();
});

test('anonymous visitor is sent to sign-in and sees no lineage data', async ({ page }) => {
  await blockExternal(page);
  await page.goto(`${APP}/dashboard/vault`);
  await expect(page).toHaveURL(/\/operator\/login/);
  const text = await bodyText(page);
  expect(text).not.toMatch(/SECRET_PAYLOAD|STAGING OPERATOR|STAGING UNOWNED|SYNTH_ERROR/);
});

test('ordinary family account cannot open the Vault and sees no lineage data', async ({ page }) => {
  await blockExternal(page);
  await signIn(page, accounts.family, '/login');
  await waitForSession(page);
  await page.goto(`${APP}/dashboard/vault`);
  await dismissPrompts(page);
  await expect(page).toHaveURL(/\/operator\/login/);
  await expect(page.getByTestId('lineage-row-count')).toHaveCount(0);
  const text = await bodyText(page);
  expect(text).not.toMatch(/SECRET_PAYLOAD|STAGING OPERATOR|STAGING UNOWNED|SYNTH_ERROR/);
});

test('family account with a forged operator role reaches the screen but the server refuses the data', async ({ page }) => {
  await blockExternal(page);
  await signIn(page, accounts.forged, '/operator/login');
  await page.waitForURL(/\/dashboard/);
  await openVault(page);
  await expect(page.getByText('Not authorized to view facility lineage')).toBeVisible();
  await expect(page.getByTestId('lineage-row-count')).toHaveText('0');
  const text = await bodyText(page);
  expect(text).not.toMatch(/SECRET_PAYLOAD|STAGING OPERATOR|STAGING UNOWNED|SYNTH_ERROR/);
});

test('operator sees only their own facility, without errors, trace IDs or payloads; CSV is clean', async ({ page }) => {
  await blockExternal(page);
  await signIn(page, accounts.operator1, '/operator/login');
  await page.waitForURL(/\/dashboard/);
  await openVault(page);
  await expect(page.getByTestId('lineage-row-count')).toHaveText('1');
  const text = await bodyText(page);
  expect(text).toContain('STAGING OPERATOR1 FACILITY');
  expect(text).not.toContain('STAGING OPERATOR2 FACILITY');
  expect(text).not.toContain('STAGING UNOWNED FACILITY');
  expect(text).not.toContain('SYNTH_ERROR_F1');
  expect(text).toContain('raw: --');
  expect(text).toContain('canonical: --');
  expect(text).toContain('$4,200');
  expect(text).not.toMatch(/SECRET_PAYLOAD/);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export CSV' }).first().click(),
  ]);
  const csv = await readDownload(download);
  expect(csv).toContain('STAGING OPERATOR1 FACILITY');
  expect(csv).not.toContain('STAGING OPERATOR2 FACILITY');
  expect(csv).not.toMatch(/\bnull\b|undefined|SYNTH_ERROR|SECRET_PAYLOAD/);
});

test('second operator is isolated from the first operator facility and sees a suppressed one-facility benchmark', async ({ page }) => {
  await blockExternal(page);
  await signIn(page, accounts.operator2, '/operator/login');
  await page.waitForURL(/\/dashboard/);
  await openVault(page);
  await expect(page.getByTestId('lineage-row-count')).toHaveText('1');
  const text = await bodyText(page);
  expect(text).toContain('STAGING OPERATOR2 FACILITY');
  expect(text).not.toContain('STAGING OPERATOR1 FACILITY');
  expect(text).toContain('suppressed');
  expect(text).not.toContain('$3,100');
});

test('platform staff see every facility with errors and trace IDs, with suppression and no payloads', async ({ page }) => {
  await blockExternal(page);
  await signIn(page, accounts.staff, '/operator/login');
  await page.waitForURL(/\/dashboard/);
  await openVault(page);
  await expect(page.getByTestId('lineage-row-count')).toHaveText('3');
  const text = await bodyText(page);
  expect(text).toContain('STAGING OPERATOR1 FACILITY');
  expect(text).toContain('STAGING OPERATOR2 FACILITY');
  expect(text).toContain('STAGING UNOWNED FACILITY');
  expect(text).toContain('SYNTH_ERROR_F1');
  expect(text).toMatch(/raw: [0-9a-f]{8}/);
  expect(text).toContain('$4,200');
  expect(text).not.toContain('$3,100');
  expect(text).not.toMatch(/SECRET_PAYLOAD/);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export CSV' }).first().click(),
  ]);
  const csv = await readDownload(download);
  expect(csv).toContain('raw_event_id');
  expect(csv).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/);
  expect(csv).not.toMatch(/SECRET_PAYLOAD/);
});

test('a server failure shows an explicit error and the Vault stays usable', async ({ page }) => {
  await blockExternal(page);
  await page.route('**/rest/v1/rpc/get_operator_facility_lineage**', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'simulated outage' }) })
  );
  await signIn(page, accounts.operator1, '/operator/login');
  await page.waitForURL(/\/dashboard/);
  await openVault(page);
  await expect(page.getByText('simulated outage')).toBeVisible();
  await expect(page.getByTestId('lineage-row-count')).toHaveText('0');
});
