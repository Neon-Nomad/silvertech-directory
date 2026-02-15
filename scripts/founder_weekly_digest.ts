import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_URL = process.env.FOUNDER_DAILY_WEBHOOK_URL || process.env.ALERT_WEBHOOK_URL || '';
const SHOULD_NOTIFY =
  process.argv.includes('--notify') || process.env.FOUNDER_WEEKLY_NOTIFY === 'true';

const MAX_PENDING = Number(process.env.PIPELINE_MAX_PENDING_EVENTS || 500);
const RAW_MAX_MINUTES = Number(process.env.PIPELINE_RAW_MAX_MINUTES || 180);
const NORMALIZED_MAX_MINUTES = Number(process.env.PIPELINE_NORMALIZED_MAX_MINUTES || 240);
const READ_MODEL_MAX_MINUTES = Number(process.env.PIPELINE_READ_MODEL_MAX_MINUTES || 360);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const daysAgoIsoDate = (daysAgo: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

const daysAgoIsoTimestamp = (daysAgo: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString();
};

const minutesSince = (iso: string | null) => {
  if (!iso) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
};

const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
const formatNumber = (value: number) => value.toLocaleString('en-US');

const sendWebhook = async (text: string) => {
  if (!WEBHOOK_URL) return;
  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      app: 'silvertech-directory',
      scope: 'founder-weekly-digest',
      timestamp: new Date().toISOString(),
    }),
  });
};

const main = async () => {
  const currentStartDate = daysAgoIsoDate(7);
  const previousStartDate = daysAgoIsoDate(14);
  const previousEndDate = daysAgoIsoDate(8);
  const currentStartTs = daysAgoIsoTimestamp(7);
  const previousStartTs = daysAgoIsoTimestamp(14);
  const previousEndTs = daysAgoIsoTimestamp(7);

  const [
    profileRes,
    leadsCurrentRes,
    leadsPreviousRes,
    funnelCurrentRes,
    funnelPreviousRes,
    deadLettersRes,
    healthRes,
  ] = await Promise.all([
    supabase
      .from('api_v1_facility_profile_summary')
      .select('facility_id, profile_strength_score'),
    supabase
      .from('api_v1_lead_lifecycle')
      .select('lead_id', { count: 'exact' })
      .gte('created_at', currentStartTs),
    supabase
      .from('api_v1_lead_lifecycle')
      .select('lead_id', { count: 'exact' })
      .gte('created_at', previousStartTs)
      .lt('created_at', previousEndTs),
    supabase
      .from('api_v1_attribution_funnel_daily')
      .select('impressions, engagement, intent, conversions')
      .gte('bucket_date', currentStartDate),
    supabase
      .from('api_v1_attribution_funnel_daily')
      .select('impressions, engagement, intent, conversions')
      .gte('bucket_date', previousStartDate)
      .lt('bucket_date', previousEndDate),
    supabase.from('normalization_dead_letters').select('id', { count: 'exact', head: true }),
    supabase.rpc('get_data_pipeline_health'),
  ]);

  const firstError =
    profileRes.error ||
    leadsCurrentRes.error ||
    leadsPreviousRes.error ||
    funnelCurrentRes.error ||
    funnelPreviousRes.error ||
    deadLettersRes.error ||
    healthRes.error;

  if (firstError) {
    throw firstError;
  }

  const facilityProfiles = profileRes.data || [];
  const facilityCount = facilityProfiles.length;
  const avgProfileStrength =
    facilityCount > 0
      ? facilityProfiles.reduce(
          (sum, row) => sum + Number(row.profile_strength_score || 0),
          0
        ) / facilityCount
      : 0;

  const leadsCurrent = leadsCurrentRes.count || 0;
  const leadsPrevious = leadsPreviousRes.count || 0;
  const leadVelocity =
    leadsPrevious > 0 ? ((leadsCurrent - leadsPrevious) / leadsPrevious) * 100 : 0;

  const funnelCurrent = (funnelCurrentRes.data || []).reduce(
    (acc, row) => ({
      impressions: acc.impressions + Number(row.impressions || 0),
      engagement: acc.engagement + Number(row.engagement || 0),
      intent: acc.intent + Number(row.intent || 0),
      conversions: acc.conversions + Number(row.conversions || 0),
    }),
    { impressions: 0, engagement: 0, intent: 0, conversions: 0 }
  );

  const funnelPrevious = (funnelPreviousRes.data || []).reduce(
    (acc, row) => ({
      impressions: acc.impressions + Number(row.impressions || 0),
      engagement: acc.engagement + Number(row.engagement || 0),
      intent: acc.intent + Number(row.intent || 0),
      conversions: acc.conversions + Number(row.conversions || 0),
    }),
    { impressions: 0, engagement: 0, intent: 0, conversions: 0 }
  );

  const conversionRateCurrent =
    funnelCurrent.intent > 0 ? (funnelCurrent.conversions / funnelCurrent.intent) * 100 : 0;
  const conversionRatePrevious =
    funnelPrevious.intent > 0 ? (funnelPrevious.conversions / funnelPrevious.intent) * 100 : 0;

  const deadLetterCount = deadLettersRes.count || 0;
  const pipelineHealth = (healthRes.data?.[0] || {
    pending_raw_events: 0,
    latest_raw_ingested_at: null,
    latest_normalized_at: null,
    latest_read_model_refresh_at: null,
  }) as {
    pending_raw_events: number;
    latest_raw_ingested_at: string | null;
    latest_normalized_at: string | null;
    latest_read_model_refresh_at: string | null;
  };

  const rawLag = minutesSince(pipelineHealth.latest_raw_ingested_at);
  const normLag = minutesSince(pipelineHealth.latest_normalized_at);
  const readLag = minutesSince(pipelineHealth.latest_read_model_refresh_at);

  const actions: string[] = [];
  if (deadLetterCount > 0) {
    actions.push(
      `Resolve ${deadLetterCount} dead letters (run pipeline:retry, then inspect failures).`
    );
  }
  if (avgProfileStrength < 70 && facilityCount > 0) {
    actions.push(
      `Raise profile strength (avg ${avgProfileStrength.toFixed(
        1
      )}/100): prioritize photos + amenities completeness.`
    );
  }
  if (leadsCurrent < leadsPrevious && leadsPrevious > 0) {
    actions.push(
      `Lead volume is down ${formatPercent(
        leadVelocity
      )}: review search visibility and response speed this week.`
    );
  }
  if (funnelCurrent.intent > 0 && funnelCurrent.conversions === 0) {
    actions.push(
      'Intent exists but no conversions: audit follow-up workflow and tour scheduling path.'
    );
  }
  if (pipelineHealth.pending_raw_events > MAX_PENDING) {
    actions.push(
      `Pipeline backlog high (${pipelineHealth.pending_raw_events} > ${MAX_PENDING}): run founder:daily.`
    );
  }
  if (rawLag !== null && rawLag > RAW_MAX_MINUTES) {
    actions.push(`Raw ingestion lag high (${rawLag}m): check source ingestion jobs.`);
  }
  if (normLag !== null && normLag > NORMALIZED_MAX_MINUTES) {
    actions.push(`Normalization lag high (${normLag}m): inspect normalize worker logs.`);
  }
  if (readLag !== null && readLag > READ_MODEL_MAX_MINUTES) {
    actions.push(`Read model lag high (${readLag}m): run pipeline:refresh-models.`);
  }
  if (actions.length === 0) {
    actions.push('No critical actions detected. Keep founder:daily + founder:exceptions running.');
  }

  const lines = [
    'SilverTech Weekly Founder Digest',
    `Generated: ${new Date().toISOString()}`,
    '',
    'KPI Snapshot (last 7 days):',
    `- Facilities tracked: ${formatNumber(facilityCount)}`,
    `- Avg profile strength: ${avgProfileStrength.toFixed(1)} / 100`,
    `- Leads: ${formatNumber(leadsCurrent)} (prev 7d: ${formatNumber(leadsPrevious)}, velocity ${formatPercent(
      leadVelocity
    )})`,
    `- Funnel: impressions ${formatNumber(funnelCurrent.impressions)}, engagement ${formatNumber(
      funnelCurrent.engagement
    )}, intent ${formatNumber(funnelCurrent.intent)}, conversions ${formatNumber(
      funnelCurrent.conversions
    )}`,
    `- Intent->Conversion rate: ${conversionRateCurrent.toFixed(1)}% (prev ${conversionRatePrevious.toFixed(
      1
    )}%)`,
    '',
    'Pipeline Integrity:',
    `- Pending raw events: ${pipelineHealth.pending_raw_events}`,
    `- Dead letters: ${deadLetterCount}`,
    `- Raw lag (min): ${rawLag ?? 'n/a'}`,
    `- Normalization lag (min): ${normLag ?? 'n/a'}`,
    `- Read model lag (min): ${readLag ?? 'n/a'}`,
    '',
    'Top Actions:',
    ...actions.map((action, idx) => `${idx + 1}. ${action}`),
  ];

  const digest = lines.join('\n');
  console.log(digest);

  if (SHOULD_NOTIFY) {
    await sendWebhook(digest);
  }
};

main().catch(async (err) => {
  const message = `Founder weekly digest crashed: ${String(err)}`;
  console.error(message);
  if (SHOULD_NOTIFY) {
    try {
      await sendWebhook(message);
    } catch {
      // Ignore webhook send errors in crash path.
    }
  }
  process.exit(1);
});
