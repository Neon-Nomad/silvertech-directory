import { expect, test, type Page } from '@playwright/test';

// Family-facing interactions, signed out. Run against a Netlify Deploy Preview (BASE_URL), where the
// published _headers policy applies. Nothing here writes to a database or sends mail: the tour request
// is answered by a mocked send-tour-guide function, and the save button only reaches the sign-in redirect.
const BASE = process.env.BASE_URL ?? 'https://silvertechdirectory.com';
const FACILITY = '/assisted-living/minnesota/minneapolis/hope-wellness-center-inc-1127636603/';
const CITY = '/assisted-living/minnesota/minneapolis/';

// securitypolicyviolation fires for every blocked resource and inline script, including ones the console omits.
async function recordCspViolations(page: Page) {
  await page.addInitScript(() => {
    (window as any).__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      (window as any).__cspViolations.push(`${e.violatedDirective} ${e.blockedURI || '(inline)'}`);
    });
  });
}

// Netlify's deploy-preview toolbar injects a frame from app.netlify.com. Production never does, so
// that one violation is ignored on preview hosts only. Every other violation still fails.
const isNetlifyPreview = /netlify\.app/.test(BASE);
const NETLIFY_TOOLBAR_FRAME = 'frame-src https://app.netlify.com';

async function cspViolations(page: Page): Promise<string[]> {
  const all: string[] = await page.evaluate(() => (window as any).__cspViolations ?? []);
  return all.filter((v) => !(isNetlifyPreview && v === NETLIFY_TOOLBAR_FRAME));
}

function collectConsole(page: Page) {
  const errors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));
  return { errors, pageErrors };
}

test.describe('family interactions on the facility page', () => {
  test.beforeEach(async ({ page }) => {
    await recordCspViolations(page);
  });

  test('Save to Dashboard hands a signed-out family to sign-in and back to the facility', async ({ page }) => {
    const log = collectConsole(page);
    await page.goto(BASE + FACILITY, { waitUntil: 'domcontentloaded' });

    const save = page.getByRole('button', { name: 'Save to Dashboard' });
    await save.scrollIntoViewIfNeeded();
    await expect(save).toBeEnabled({ timeout: 20000 });
    await save.click();

    await page.waitForURL(/\/login\?redirect_to=/, { timeout: 20000 });
    expect(new URL(page.url()).searchParams.get('redirect_to')).toBe(FACILITY);
    expect(log.pageErrors).toEqual([]);
    expect(await cspViolations(page)).toEqual([]);
  });

  test('Tour prep guide form confirms the request (send function mocked, no mail sent)', async ({ page }) => {
    const log = collectConsole(page);
    let posted: Record<string, unknown> | null = null;
    await page.route('**/.netlify/functions/send-tour-guide', async (route) => {
      posted = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.goto(BASE + FACILITY, { waitUntil: 'domcontentloaded' });
    const email = page.getByLabel('Your email address');
    await email.scrollIntoViewIfNeeded();
    await expect(email).toBeVisible({ timeout: 20000 });
    await email.fill('family-test@example.com');
    await page
      .locator('form', { has: page.getByLabel('Your email address') })
      .getByRole('button', { name: 'Send My Guide' })
      .click();

    await expect(page.getByText('Tour prep guide on its way!')).toBeVisible({ timeout: 20000 });
    expect(posted).toMatchObject({ email: 'family-test@example.com' });
    expect(log.pageErrors).toEqual([]);
    expect(await cspViolations(page)).toEqual([]);
  });

  test('map Zoom in requests new map tiles (the control acts on the map)', async ({ page }) => {
    const log = collectConsole(page);
    await page.goto(BASE + FACILITY, { waitUntil: 'domcontentloaded' });

    const zoomIn = page.getByRole('button', { name: 'Zoom in' });
    await zoomIn.scrollIntoViewIfNeeded();
    await expect(zoomIn).toBeVisible({ timeout: 20000 });

    let tileRequests = 0;
    page.on('request', (r) => {
      if (/\/\d+\/\d+\/\d+(\.png|@2x\.png|\.jpg)?(\?|$)/.test(r.url()) && r.resourceType() === 'image') tileRequests += 1;
    });
    await zoomIn.click();
    await expect.poll(() => tileRequests, { timeout: 10000 }).toBeGreaterThan(0);

    expect(log.pageErrors).toEqual([]);
    expect(await cspViolations(page)).toEqual([]);
  });

  test('Q&A island renders its sign-up call to action (client-only island ran)', async ({ page }) => {
    const log = collectConsole(page);
    await page.goto(BASE + FACILITY, { waitUntil: 'domcontentloaded' });

    const cta = page.getByText('Have a question about', { exact: false });
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('link', { name: 'Ask a Question — Free' })).toHaveAttribute('href', '/register');

    expect(log.pageErrors).toEqual([]);
    expect(await cspViolations(page)).toEqual([]);
  });

  test('claimed-profile island renders its profile section (client:visible island ran)', async ({ page }) => {
    const log = collectConsole(page);
    await page.goto(BASE + FACILITY, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Unclaimed listings show locked rows; claimed listings show a badge. Either proves the island rendered.
    const profile = page.locator('.fcp-locked-rows, .fcp-claimed-badge, .fcp-claimed-empty').first();
    await expect(profile).toBeAttached({ timeout: 20000 });

    expect(log.pageErrors).toEqual([]);
    expect(await cspViolations(page)).toEqual([]);
  });

  test('page health: GTM loads, the font applies, and no uncaught errors or CSP violations', async ({ page }) => {
    const log = collectConsole(page);
    const gtm = page.waitForResponse((r) => r.url().startsWith('https://www.googletagmanager.com/gtag/js'), { timeout: 30000 });
    await page.goto(BASE + FACILITY, { waitUntil: 'load' });

    expect((await gtm).ok()).toBeTruthy();
    expect(await page.evaluate(() => Array.isArray((window as any).dataLayer))).toBeTruthy();

    const font = page.locator('link[data-font-onload]').first();
    await expect(font).toHaveJSProperty('media', 'all', { timeout: 20000 });

    // Console errors are reported, not failed: third-party scripts log noise this test does not own.
    test.info().annotations.push({ type: 'console-errors', description: log.errors.join(' | ') || 'none' });
    expect(log.pageErrors).toEqual([]);
    expect(await cspViolations(page)).toEqual([]);
  });
});

test.describe('family interactions on the city directory', () => {
  test.beforeEach(async ({ page }) => {
    await recordCspViolations(page);
  });

  test('directory islands hydrate without CSP violations', async ({ page }) => {
    const log = collectConsole(page);
    await page.goto(BASE + CITY, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('astro-island[ssr]')).toHaveCount(0, { timeout: 20000 });

    expect(log.pageErrors).toEqual([]);
    expect(await cspViolations(page)).toEqual([]);
  });
});

test.describe('family interactions at phone width (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await recordCspViolations(page);
  });

  test('facility page has no horizontal overflow and the save control is reachable', async ({ page }) => {
    const log = collectConsole(page);
    await page.goto(BASE + FACILITY, { waitUntil: 'domcontentloaded' });

    const overflowPx = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflowPx, 'horizontal overflow in CSS pixels').toBeLessThanOrEqual(0);

    const save = page.getByRole('button', { name: 'Save to Dashboard' });
    await save.scrollIntoViewIfNeeded();
    await expect(save).toBeVisible({ timeout: 20000 });

    expect(log.pageErrors).toEqual([]);
    expect(await cspViolations(page)).toEqual([]);
  });

  test('city directory has no horizontal overflow', async ({ page }) => {
    await page.goto(BASE + CITY, { waitUntil: 'domcontentloaded' });
    const overflowPx = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflowPx, 'horizontal overflow in CSS pixels').toBeLessThanOrEqual(0);
    expect(await cspViolations(page)).toEqual([]);
  });
});
