import { spawnSync } from 'node:child_process';

type Check = {
  name: string;
  ok: boolean;
  detail?: string;
};

const SITE_URL = (process.env.SITE_URL || 'https://silvertechdirectory.com').replace(/\/+$/, '');
const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL || '';

const checks: Check[] = [];

const addCheck = (name: string, ok: boolean, detail?: string) => {
  checks.push({ name, ok, detail });
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${name}${detail ? ` - ${detail}` : ''}`);
};

const checkUrlOk = async (path: string, name: string) => {
  try {
    const res = await fetch(`${SITE_URL}${path}`, { method: 'GET', redirect: 'follow' });
    addCheck(name, res.status === 200, `status=${res.status}`);
  } catch (err) {
    addCheck(name, false, String(err));
  }
};

const checkLegacyTabRedirect = async () => {
  const legacyUrl = `${SITE_URL}/dashboard?tab=listings`;
  try {
    const res = await fetch(legacyUrl, { method: 'GET', redirect: 'manual' });
    const location = res.headers.get('location') || '';
    const redirected = res.status >= 300 && res.status < 400;
    const canonical = /\/dashboard\/listings(\?|$)/.test(location);
    addCheck(
      'Legacy tab redirect to canonical',
      redirected && canonical,
      `status=${res.status}; location=${location || 'none'}`
    );
  } catch (err) {
    addCheck('Legacy tab redirect to canonical', false, String(err));
  }
};

const runTargetedTests = () => {
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(
    cmd,
    [
      'vitest',
      '--run',
      'tests/dashboardRouting.test.ts',
      'tests/leadsView.test.tsx',
      'tests/billingErrors.test.ts',
    ],
    { stdio: 'inherit' }
  );

  addCheck('Targeted trust + routing tests', (result.status ?? 1) === 0, `exit=${result.status ?? 1}`);
};

const sendAlert = async (message: string) => {
  if (!ALERT_WEBHOOK_URL) return;
  try {
    await fetch(ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
        app: 'silvertech-directory',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('Failed to send webhook alert:', err);
  }
};

const main = async () => {
  console.log(`Monitoring Phase 1 integrity for ${SITE_URL}`);
  await checkUrlOk('/', 'Homepage available');
  await checkUrlOk('/search', 'Search page available');
  await checkUrlOk('/sitemap.xml', 'Sitemap available');
  await checkLegacyTabRedirect();
  runTargetedTests();

  const failed = checks.filter((c) => !c.ok);
  if (failed.length > 0) {
    const summary = failed.map((f) => `- ${f.name}${f.detail ? ` (${f.detail})` : ''}`).join('\n');
    const msg = `Phase 1 monitor FAILED on ${SITE_URL}\n${summary}`;
    console.error(msg);
    await sendAlert(msg);
    process.exit(1);
  }

  console.log('All monitoring checks passed.');
};

main().catch(async (err) => {
  const msg = `Phase 1 monitor crashed on ${SITE_URL}: ${String(err)}`;
  console.error(msg);
  await sendAlert(msg);
  process.exit(1);
});

