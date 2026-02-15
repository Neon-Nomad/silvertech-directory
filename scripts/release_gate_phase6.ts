import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

type GateCheck = {
  name: string;
  ok: boolean;
  detail?: string;
};

const checks: GateCheck[] = [];

const addCheck = (name: string, ok: boolean, detail?: string) => {
  checks.push({ name, ok, detail });
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${name}${detail ? ` - ${detail}` : ''}`);
};

const REQUIRED_HELP_ROUTE_KEYS = [
  'dashboard_overview',
  'dashboard_listings',
  'dashboard_leads',
  'dashboard_qa',
  'dashboard_billing',
  'dashboard_help',
] as const;

const REQUIRED_METRICS = [
  'roi_estimated_impact',
  'lead_velocity',
  'profile_completeness',
] as const;

const assertFileExists = (relativePath: string) => {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const ok = existsSync(absolutePath);
  addCheck(`Required file exists: ${relativePath}`, ok);
  return ok ? absolutePath : null;
};

const validateHelpRegistry = (absolutePath: string) => {
  try {
    const raw = readFileSync(absolutePath, 'utf8');
    const registry = JSON.parse(raw) as {
      routes?: Record<string, { article_ids?: string[]; title?: string; contextual_tip?: string }>;
      articles?: Record<string, { id?: string; slug?: string; title?: string; content_md?: string }>;
    };

    const routes = registry.routes || {};
    const articles = registry.articles || {};

    const hasCoreRoutes = REQUIRED_HELP_ROUTE_KEYS.every((key) => Boolean(routes[key]));
    addCheck('Help registry has required dashboard route keys', hasCoreRoutes);

    const allRouteArticlesExist = REQUIRED_HELP_ROUTE_KEYS.every((key) => {
      const articleIds = routes[key]?.article_ids || [];
      return articleIds.length > 0 && articleIds.every((id) => Boolean(articles[id]));
    });
    addCheck('Help registry route article mappings are valid', allRouteArticlesExist);

    const hasStructuredArticles = Object.values(articles).every(
      (article) => Boolean(article.id && article.slug && article.title && article.content_md)
    );
    addCheck('Help registry articles include required fields', hasStructuredArticles, `count=${Object.keys(articles).length}`);
  } catch (err) {
    addCheck('Help registry JSON parses', false, String(err));
  }
};

const validateMetricsDictionary = (absolutePath: string) => {
  try {
    const raw = readFileSync(absolutePath, 'utf8');
    const dictionary = parse(raw) as {
      version?: string;
      metrics?: Record<string, any>;
      placeholders?: { insufficient_data?: { title?: string; body?: string; cta?: string } };
    };

    addCheck('Metrics dictionary has version', Boolean(dictionary.version));

    const metrics = dictionary.metrics || {};
    const hasRequiredMetrics = REQUIRED_METRICS.every((metricKey) => Boolean(metrics[metricKey]));
    addCheck('Metrics dictionary has required core metrics', hasRequiredMetrics);

    const roi = metrics.roi_estimated_impact || {};
    const guardrails = roi.guardrails || {};
    const hasGuardrails = Boolean(
      guardrails.hard_min !== undefined &&
      guardrails.hard_max !== undefined &&
      guardrails.safe_min !== undefined &&
      guardrails.safe_max !== undefined &&
      guardrails.market_default !== undefined
    );
    addCheck('ROI metric has hard/safe guardrails', hasGuardrails);

    const hasRoiTrustLabel = typeof roi.trust_label === 'string' && roi.trust_label.trim().length > 0;
    addCheck('ROI metric has trust label', hasRoiTrustLabel);

    const insufficientData = dictionary.placeholders?.insufficient_data;
    const hasPlaceholderContract = Boolean(
      insufficientData?.title &&
      insufficientData?.body &&
      insufficientData?.cta
    );
    addCheck('Insufficient-data placeholder contract exists', hasPlaceholderContract);
  } catch (err) {
    addCheck('Metrics dictionary YAML parses', false, String(err));
  }
};

const maybeCheckLiveEndpoints = async () => {
  if (process.env.PHASE6_LIVE_GATE !== 'true') {
    addCheck('Live endpoint gate skipped', true, 'Set PHASE6_LIVE_GATE=true to enforce');
    return;
  }

  const siteUrl = (process.env.SITE_URL || 'https://silvertechdirectory.com').replace(/\/+$/, '');

  try {
    const sitemapRes = await fetch(`${siteUrl}/sitemap.xml`, { method: 'GET', redirect: 'follow' });
    addCheck('Live sitemap endpoint healthy', sitemapRes.status === 200, `status=${sitemapRes.status}`);
  } catch (err) {
    addCheck('Live sitemap endpoint healthy', false, String(err));
  }

  try {
    const helpRes = await fetch(`${siteUrl}/help-registry.json`, { method: 'GET', redirect: 'follow' });
    const contentType = (helpRes.headers.get('content-type') || '').toLowerCase();
    const isJson = contentType.includes('application/json');
    addCheck('Live help registry returns JSON', isJson, `status=${helpRes.status}; content-type=${contentType || 'unknown'}`);
  } catch (err) {
    addCheck('Live help registry returns JSON', false, String(err));
  }
};

const main = async () => {
  console.log('Running Phase 6 release gate checks');

  const helpRegistryPath = assertFileExists('public/help-registry.json');
  const metricsDictionaryPath = assertFileExists('metrics-dictionary.yaml');
  assertFileExists('.github/workflows/ops-integrity.yml');

  if (helpRegistryPath) validateHelpRegistry(helpRegistryPath);
  if (metricsDictionaryPath) validateMetricsDictionary(metricsDictionaryPath);
  await maybeCheckLiveEndpoints();

  const failed = checks.filter((c) => !c.ok);
  if (failed.length > 0) {
    console.error('\nPhase 6 release gate failed:');
    for (const fail of failed) {
      console.error(`- ${fail.name}${fail.detail ? ` (${fail.detail})` : ''}`);
    }
    process.exit(1);
  }

  console.log('\nPhase 6 release gate passed.');
};

main().catch((err) => {
  console.error('Phase 6 release gate crashed:', err);
  process.exit(1);
});

