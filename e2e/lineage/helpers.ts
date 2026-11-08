import fs from 'node:fs';
import { expect, type Download, type Page } from '@playwright/test';

// Isolated local stack only. These guards refuse to run against anything other than 127.0.0.1:56321.
export const APP = process.env.LINEAGE_APP_URL ?? 'http://localhost:5173';
export const API = 'http://127.0.0.1:56321';
export const PASSWORD = 'LocalStaging!123';

export const accounts = {
  family: 'family.staging@lineage.test',
  forged: 'forged.staging@lineage.test',
  operator1: 'operator1.staging@lineage.test',
  operator2: 'operator2.staging@lineage.test',
  staff: 'staff.staging@lineage.test',
};

export async function assertIsolatedStack() {
  const res = await fetch(`${API}/auth/v1/health`, { signal: AbortSignal.timeout(10_000) });
  expect(res.status).toBe(200);
}

// Only the app itself and the local stack may be reached. Everything else (analytics, maps, payments) is aborted.
export async function blockExternal(page: Page) {
  await page.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    return host === 'localhost' || host === '127.0.0.1' ? route.continue() : route.abort();
  });
}

// The site shows an "Enable location?" modal on first load; it covers the page until dismissed.
export async function dismissPrompts(page: Page) {
  const notNow = page.getByRole('button', { name: 'Not now' });
  if (await notNow.isVisible({ timeout: 4000 }).catch(() => false)) await notNow.click();
}

export async function signIn(page: Page, email: string, path: '/login' | '/operator/login') {
  await page.goto(`${APP}${path}`);
  await dismissPrompts(page);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click();
  await waitForSession(page);
}

// The stored Supabase session is the signal that sign-in finished; the landing page differs by account type.
export async function waitForSession(page: Page) {
  await page.waitForFunction(() => Object.keys(window.localStorage).some((k) => k.startsWith('sb-') && k.endsWith('-auth-token')), null, { timeout: 30_000 });
}

export async function openVault(page: Page) {
  await page.goto(`${APP}/dashboard/vault`);
  await dismissPrompts(page);
  const dismiss = page.getByRole('button', { name: 'Dismiss Vault help' });
  if (await dismiss.isVisible().catch(() => false)) await dismiss.click();
}

export async function bodyText(page: Page): Promise<string> {
  return page.locator('body').innerText();
}

export async function readDownload(download: Download): Promise<string> {
  const path = await download.path();
  if (!path) throw new Error('download has no local path');
  return fs.readFileSync(path, 'utf8');
}
