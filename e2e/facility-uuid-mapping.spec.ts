import { expect, test, type Page } from '@playwright/test';

// Build-time UUID mapping, verified in a browser. Runs against a Deploy Preview (BASE_URL).
// Read-only: the tests make anonymous reads of public facility data, and never sign in or write.
const BASE = process.env.BASE_URL ?? 'https://silvertechdirectory.com';
const MAPPED = { path: '/assisted-living/minnesota/minneapolis/hope-wellness-center-inc-1127636603/', uuid: 'f67a0c7c-7c29-4e06-8346-59e492080864' };
// Identical duplicate group: unresolved on purpose (the map leaves it unresolved; no UUID may be attached).
const UNRESOLVED = { path: '/nursing-homes/alabama/altoona/altoona-health-rehab-41/' };

function recordDatabaseCalls(page: Page) {
  const calls: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/rest/v1/') || r.url().includes('/rpc/')) calls.push(r.url());
  });
  return calls;
}

test.describe('mapped facility', () => {
  test('Save to Dashboard and Q&A use the mapped UUID only', async ({ page }) => {
    const calls = recordDatabaseCalls(page);
    await page.goto(BASE + MAPPED.path, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByRole('button', { name: 'Save to Dashboard' })).toBeAttached({ timeout: 20000 });
    await expect(page.getByText('Have a question about', { exact: false })).toBeAttached({ timeout: 20000 });
    await page.waitForTimeout(1500);
    const qa = calls.filter((u) => u.includes('approved_facility_qa'));
    expect(qa.length).toBeGreaterThan(0);
    for (const u of qa) expect(u).toContain(MAPPED.uuid);
    const other = calls.filter((u) => /facility_id=eq\.[0-9a-f-]{36}/.test(u) && !u.includes(MAPPED.uuid));
    expect(other).toEqual([]);
  });
});

test.describe('unresolved facility', () => {
  test('shows explicit unavailable states and makes no facility-scoped database call', async ({ page }) => {
    const calls = recordDatabaseCalls(page);
    await page.goto(BASE + UNRESOLVED.path, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByText('not available for this listing yet', { exact: false }).first()).toBeAttached({ timeout: 20000 });
    await expect(page.getByRole('button', { name: 'Save to Dashboard' })).toHaveCount(0);
    await expect(page.getByText('Community questions for', { exact: false })).toBeAttached({ timeout: 20000 });
    await page.waitForTimeout(1500);
    const facilityScoped = calls.filter((u) => /facility_id=eq\.|p_facility_id/.test(u) || /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(u));
    expect(facilityScoped).toEqual([]);
  });
});
