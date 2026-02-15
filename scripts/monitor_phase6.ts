import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

type Check = {
  name: string;
  ok: boolean;
  detail?: string;
};

const SITE_URL = (process.env.SITE_URL || 'https://silvertechdirectory.com').replace(/\/+$/, '');
const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL || '';
const STRICT_LIVE_HELP_REGISTRY = process.env.STRICT_LIVE_HELP_REGISTRY !== 'false';

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

const checkHelpRegistryShape = async () => {
  try {
    const res = await fetch(`${SITE_URL}/help-registry.json`, { method: 'GET', redirect: 'follow' });
    if (res.status !== 200) {
      addCheck('Help registry available', false, `status=${res.status}`);
      return;
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      addCheck(
        'Live help registry returns JSON',
        !STRICT_LIVE_HELP_REGISTRY,
        `content-type=${contentType || 'unknown'}`
      );
    } else {
      addCheck('Live help registry returns JSON', true, `content-type=${contentType}`);
    }

    const localRegistryPath = path.resolve(process.cwd(), 'public/help-registry.json');
    const localRaw = readFileSync(localRegistryPath, 'utf8');
    const local = JSON.parse(localRaw) as {
      routes?: Record<string, unknown>;
      articles?: Record<string, unknown>;
    };
    const localHasCoreRoutes = Boolean(
      local?.routes?.dashboard_overview &&
      local?.routes?.dashboard_listings &&
      local?.routes?.dashboard_leads &&
      local?.routes?.dashboard_qa &&
      local?.routes?.dashboard_billing &&
      local?.routes?.dashboard_help
    );
    const localHasArticles = Boolean(local?.articles && Object.keys(local.articles).length > 0);
    addCheck('Local help registry has dashboard route map', localHasCoreRoutes);
    addCheck('Local help registry has articles', localHasArticles, `count=${Object.keys(local?.articles || {}).length}`);

    // Only parse live body when endpoint is actually JSON.
    if (!contentType.includes('application/json')) {
      return;
    }

    const body = (await res.json()) as {
      routes?: Record<string, unknown>;
      articles?: Record<string, unknown>;
    };

    const hasCoreRoutes = Boolean(
      body?.routes?.dashboard_overview &&
      body?.routes?.dashboard_listings &&
      body?.routes?.dashboard_leads &&
      body?.routes?.dashboard_qa &&
      body?.routes?.dashboard_billing &&
      body?.routes?.dashboard_help
    );
    const hasArticles = Boolean(body?.articles && Object.keys(body.articles).length > 0);

    addCheck('Live help registry has dashboard route map', hasCoreRoutes);
    addCheck('Live help registry has articles', hasArticles, `count=${Object.keys(body?.articles || {}).length}`);
  } catch (err) {
    addCheck('Help registry JSON parse', false, String(err));
  }
};

const runCommand = (args: string[]) => {
  return spawnSync('npx', args, {
    stdio: 'inherit',
    shell: true,
  });
};

const runTargetedUnitTests = () => {
  const result = runCommand([
      'vitest',
      '--run',
      'tests/metricsDictionary.test.ts',
      'tests/helpRegistry.test.ts',
      'tests/helpCenter.test.tsx',
      'tests/editFacility.test.tsx',
      'tests/leadsView.test.tsx',
      'tests/billingErrors.test.ts',
      'tests/dashboardRouting.test.ts',
    ]);

  const status = result.status ?? 1;
  addCheck('Phase 6 targeted unit tests', status === 0, result.error ? String(result.error) : `exit=${status}`);
};

const runTargetedE2e = () => {
  const result = runCommand([
      'playwright',
      'test',
      'e2e/redirect-interceptor.spec.ts',
      'e2e/roi-safe-zone.spec.ts',
      'e2e/billing-entitlement.spec.ts',
    ]);

  const status = result.status ?? 1;
  addCheck('Phase 6 targeted e2e checks', status === 0, result.error ? String(result.error) : `exit=${status}`);
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
        phase: 6,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('Failed to send webhook alert:', err);
  }
};

const main = async () => {
  console.log(`Monitoring Phase 6 integrity for ${SITE_URL}`);

  await checkUrlOk('/', 'Homepage available');
  await checkUrlOk('/sitemap.xml', 'Sitemap available');
  await checkUrlOk('/dashboard/leads', 'Dashboard route reachable');
  await checkHelpRegistryShape();
  runTargetedUnitTests();
  runTargetedE2e();

  const failed = checks.filter((c) => !c.ok);
  if (failed.length > 0) {
    const summary = failed.map((f) => `- ${f.name}${f.detail ? ` (${f.detail})` : ''}`).join('\n');
    const msg = `Phase 6 monitor FAILED on ${SITE_URL}\n${summary}`;
    console.error(msg);
    await sendAlert(msg);
    process.exit(1);
  }

  console.log('All Phase 6 monitoring checks passed.');
};

main().catch(async (err) => {
  const msg = `Phase 6 monitor crashed on ${SITE_URL}: ${String(err)}`;
  console.error(msg);
  await sendAlert(msg);
  process.exit(1);
});
