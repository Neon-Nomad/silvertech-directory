import { expect, test, type Page } from '@playwright/test';

// The operator claim journey, end to end, against a LOCAL Supabase stack only.
// Run with CLAIMS_TEST_API_URL (127.0.0.1 or localhost), CLAIMS_TEST_ANON_KEY and CLAIMS_TEST_SERVICE_ROLE_KEY.
// The spec refuses to run against any other host, so production cannot be reached from here.
const API = process.env.CLAIMS_TEST_API_URL ?? '';
const ANON = process.env.CLAIMS_TEST_ANON_KEY ?? '';
const SERVICE = process.env.CLAIMS_TEST_SERVICE_ROLE_KEY ?? '';
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(API);
const PASSWORD = 'ClaimTest!2026';

const REVIEWED = { id: 'dd27d2dd-58fe-4cf5-add0-5e186beba37a', name: 'Abiitan Mill City', zip: '55401', city: 'Minneapolis', state: 'MN' };
const OWNED = { id: 'fdabe345-9536-4884-9e94-794c3cc55666', name: 'Millers Landing Senior Living', zip: '55401', city: 'Minneapolis', state: 'MN' };
const DUPLICATE = { id: '3250d542-2b72-4caf-bb6a-ce15fd1420cb', name: 'Eastview Rehabilitation Healthcare Center', zip: '35203', city: 'Birmingham', state: 'AL' };
const OPERATOR = 'operator1@claims.test';
const OWNER = 'operator2@claims.test';
const FAMILY = 'family1@claims.test';

test.describe.configure({ mode: 'serial' });
test.skip(!isLocal || !ANON || !SERVICE, 'Set CLAIMS_TEST_API_URL (local), CLAIMS_TEST_ANON_KEY and CLAIMS_TEST_SERVICE_ROLE_KEY to run the claim journey.');

const adminHeaders = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' };
const rest = (path: string, init: RequestInit = {}) =>
  fetch(`${API}/rest/v1/${path}`, { ...init, headers: { ...adminHeaders, ...(init.headers as Record<string, string>) } });

const userIdByEmail = async (email: string): Promise<string> => {
  const res = await fetch(`${API}/auth/v1/admin/users?per_page=1000`, { headers: adminHeaders });
  const body = (await res.json()) as { users: Array<{ id: string; email: string }> };
  const user = body.users.find((u) => u.email === email);
  if (!user) throw new Error(`no test user ${email}`);
  return user.id;
};

const ensureUser = async (email: string, role: 'operator' | 'family') => {
  await fetch(`${API}/auth/v1/admin/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ email, password: PASSWORD, email_confirm: true, app_metadata: { role }, user_metadata: { role } }),
  });
  return userIdByEmail(email);
};

let ownerId = '';
let operatorId = '';
let familyId = '';

test.beforeAll(async () => {
  if (!isLocal) return;
  operatorId = await ensureUser(OPERATOR, 'operator');
  familyId = await ensureUser(FAMILY, 'family');
  ownerId = await ensureUser(OWNER, 'operator');

  // Facilities used by the journey. Upserts keep the fixture stable across runs.
  await rest('facilities?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([
      { id: REVIEWED.id, name: REVIEWED.name, address_line1: '100 Test Way', city: 'Minneapolis', state: 'MN', postal_code: '55401', public_slug: 'abiitan-mill-city', primary_care_type_slug: 'memory-care', website_url: 'https://abiitan.test', phone: '612-555-0101', owner_id: null },
      { id: OWNED.id, name: OWNED.name, address_line1: '300 Test Way', city: 'Minneapolis', state: 'MN', postal_code: '55401', public_slug: 'millers-landing-senior-living', primary_care_type_slug: 'independent-living', website_url: 'https://millers.test', phone: '612-555-0103', owner_id: ownerId },
      { id: DUPLICATE.id, name: DUPLICATE.name, address_line1: '200 Test Way', city: 'Birmingham', state: 'AL', postal_code: '35203', public_slug: 'eastview-rehabilitation-healthcare-center', primary_care_type_slug: 'nursing-homes', website_url: 'https://eastview.test', phone: '205-555-0102', owner_id: null },
    ]),
  });
  // Reviewed identities: the reviewed listing and the owned one. The duplicate is deliberately absent.
  await rest('facility_claim_eligibility?on_conflict=facility_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify([{ facility_id: REVIEWED.id }, { facility_id: OWNED.id }]),
  });
  await rest(`facility_claims?facility_id=in.(${REVIEWED.id},${OWNED.id},${DUPLICATE.id})`, { method: 'DELETE' });
  await rest(`saved_facilities?user_id=eq.${familyId}`, { method: 'DELETE' });
});

const dismissLocationPrompt = async (page: Page) => {
  const notNow = page.getByRole('button', { name: 'Not now' });
  if (await notNow.isVisible({ timeout: 1500 }).catch(() => false)) await notNow.click();
};

// Claim mode shows Claim Listing buttons and hides Save, so the save test searches in normal mode.
const searchByZip = async (page: Page, zip: string, claimMode = true) => {
  await page.goto(claimMode ? '/search?claim=1' : '/search');
  await dismissLocationPrompt(page);
  const input = claimMode ? page.getByPlaceholder('e.g., 75201') : page.locator('input[placeholder*=" or "]').first();
  await input.fill(zip);
  await page.getByRole('button', { name: 'Search', exact: true }).first().click();
};

const card = (page: Page, name: string) => page.locator('article').filter({ hasText: name });

const signIn = async (page: Page, email: string, path: '/operator/login' | '/login') => {
  await page.goto(path);
  await dismissLocationPrompt(page);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(PASSWORD);
  await page.locator('form button[type="submit"]').first().click();
};

test('directory: a reviewed listing offers a claim, a duplicate offers support, an owned listing offers no claim', async ({ page }) => {
  await searchByZip(page, REVIEWED.zip);
  await expect(card(page, REVIEWED.name)).toHaveCount(1, { timeout: 20000 });
  await expect(card(page, REVIEWED.name).getByRole('link', { name: 'Claim Listing' })).toHaveAttribute('href', `/claim/${REVIEWED.id}`);
  await expect(card(page, OWNED.name).getByRole('link', { name: 'Claim Listing' })).toHaveCount(0);
  await expect(card(page, OWNED.name)).toContainText('already has an owner');

  await searchByZip(page, DUPLICATE.zip);
  await expect(card(page, DUPLICATE.name)).toHaveCount(1, { timeout: 20000 });
  await expect(card(page, DUPLICATE.name).getByRole('link', { name: 'Claim Listing' })).toHaveCount(0);
  await expect(card(page, DUPLICATE.name)).toContainText('needs a verification check');
  await expect(card(page, DUPLICATE.name).getByRole('link', { name: 'Contact support' })).toBeVisible();
});

test('operator: claim click signs in, returns to the form, and the submission is pending', async ({ page }) => {
  await searchByZip(page, REVIEWED.zip);
  await card(page, REVIEWED.name).getByRole('link', { name: 'Claim Listing' }).click();
  await expect(page).toHaveURL(/\/operator\/login\?redirect_to=%2Fclaim%2F/, { timeout: 20000 });

  // Sign in on the page the claim click opened, so the redirect_to target is kept.
  await dismissLocationPrompt(page);
  await page.locator('#email').fill(OPERATOR);
  await page.locator('#password').fill(PASSWORD);
  await page.locator('form button[type="submit"]').first().click();
  await expect(page).toHaveURL(new RegExp(`/claim/${REVIEWED.id}`), { timeout: 20000 });
  await page.locator('#business-email').fill('owner@abiitan.test');
  await page.locator('#business-phone').fill('612-555-0101');
  await page.locator('#business-role').selectOption('Owner');
  await page.getByRole('button', { name: 'Submit Claim Request' }).click();
  await expect(page.getByText('Claim Submitted!')).toBeVisible({ timeout: 20000 });

  const res = await rest(`facility_claims?facility_id=eq.${REVIEWED.id}&user_id=eq.${operatorId}&select=status`);
  const rows = (await res.json()) as Array<{ status: string }>;
  expect(rows.map((r) => r.status)).toContain('pending');
});

test('family account: sees an explanation and no claim form', async ({ page }) => {
  await signIn(page, FAMILY, '/login');
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20000 });
  await page.goto(`/claim/${REVIEWED.id}`);
  await expect(page.getByText('An operator account is needed to claim a listing')).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole('button', { name: 'Submit Claim Request' })).toHaveCount(0);
});

test('operator: an owned listing and a duplicate cannot be claimed by URL', async ({ page }) => {
  await signIn(page, OPERATOR, '/operator/login');
  await expect(page).not.toHaveURL(/operator\/login/, { timeout: 20000 });

  await page.goto(`/claim/${OWNED.id}`);
  await expect(page.getByText('This listing already has an owner')).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole('button', { name: 'Submit Claim Request' })).toHaveCount(0);

  await page.goto(`/claim/${DUPLICATE.id}`);
  await expect(page.getByText('This listing cannot be claimed online yet')).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole('button', { name: 'Submit Claim Request' })).toHaveCount(0);
});

test('failure: a listing that gains an owner after the form opens is refused on submit', async ({ page }) => {
  await signIn(page, OPERATOR, '/operator/login');
  await expect(page).not.toHaveURL(/operator\/login/, { timeout: 20000 });
  await page.goto(`/claim/${REVIEWED.id}`);
  await expect(page.getByRole('button', { name: 'Submit Claim Request' })).toBeVisible({ timeout: 20000 });

  // Another operator claims it in the meantime.
  await rest(`facilities?id=eq.${REVIEWED.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ owner_id: ownerId }) });
  try {
    await page.locator('#business-email').fill('late@abiitan.test');
    await page.locator('#business-phone').fill('612-555-0199');
    await page.locator('#business-role').selectOption('Other');
    await page.getByRole('button', { name: 'Submit Claim Request' }).click();
    await expect(page.getByRole('alert')).toContainText('can no longer be claimed online', { timeout: 20000 });
    await expect(page.getByText('Claim Submitted!')).toHaveCount(0);
  } finally {
    await rest(`facilities?id=eq.${REVIEWED.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ owner_id: null }) });
  }
});

test('family account: saves a reviewed listing, and cannot save a duplicate', async ({ page }) => {
  await signIn(page, FAMILY, '/login');
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20000 });

  await searchByZip(page, REVIEWED.zip, false);
  await card(page, REVIEWED.name).getByRole('button', { name: 'Save', exact: true }).click();
  await expect(card(page, REVIEWED.name).getByRole('button', { name: 'Saved' })).toBeVisible({ timeout: 20000 });
  const saved = (await (await rest(`saved_facilities?user_id=eq.${familyId}&facility_id=eq.${REVIEWED.id}&select=facility_id`)).json()) as unknown[];
  expect(saved.length).toBeGreaterThan(0);

  await searchByZip(page, DUPLICATE.zip, false);
  await expect(card(page, DUPLICATE.name)).toHaveCount(1, { timeout: 20000 });
  await expect(card(page, DUPLICATE.name).getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
});
