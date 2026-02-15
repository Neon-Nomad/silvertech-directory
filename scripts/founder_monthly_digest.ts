import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_URL = process.env.FOUNDER_DAILY_WEBHOOK_URL || process.env.ALERT_WEBHOOK_URL || '';
const SHOULD_NOTIFY =
  process.argv.includes('--notify') || process.env.FOUNDER_MONTHLY_NOTIFY === 'true';

const MAX_PENDING = Number(process.env.PIPELINE_MAX_PENDING_EVENTS || 500);
const RAW_MAX_MINUTES = Number(process.env.PIPELINE_RAW_MAX_MINUTES || 180);
const NORMALIZED_MAX_MINUTES = Number(process.env.PIPELINE_NORMALIZED_MAX_MINUTES || 240);
const READ_MODEL_MAX_MINUTES = Number(process.env.PIPELINE_READ_MODEL_MAX_MINUTES || 360);
const DEFAULT_MONTHLY_RATE = Number(process.env.FOUNDER_DEFAULT_MONTHLY_RATE || 4500);
const DEFAULT_MOVE_IN_RATE = Number(process.env.FOUNDER_DEFAULT_MOVE_IN_RATE || 0.25);

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

const pct = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
const num = (value: number) => value.toLocaleString('en-US');
const usd = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const sendWebhook = async (text: string) => {
  if (!WEBHOOK_URL) return;
  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      app: 'silvertech-directory',
      scope: 'founder-monthly-digest',
      timestamp: new Date().toISOString(),
    }),
  });
};

const trend = (current: number, previous: number) => (previous > 0 ? ((current - previous) / previous) * 100 : 0);

const main = async () => {
  const currentStartDate = daysAgoIsoDate(30);
  const previousStartDate = daysAgoIsoDate(60);
  const previousEndDate = daysAgoIsoDate(31);
  const currentStartTs = daysAgoIsoTimestamp(30);
  const previousStartTs = daysAgoIsoTimestamp(60);
  const previousEndTs = daysAgoIsoTimestamp(30);

  const [
    profileRes,
    leadsCurrentRes,
    leadsPreviousRes,
    leadStatusRes,
    funnelCurrentRes,
    funnelPreviousRes,
    deadLettersRes,
    healthRes,
  ] = await Promise.all([
    supabase.from('api_v1_facility_profile_summary').select('profile_strength_score, confidence_score'),
    supabase.from('api_v1_lead_lifecycle').select('lead_id', { count: 'exact' }).gte('created_at', currentStartTs),
    supabase
      .from('api_v1_lead_lifecycle')
      .select('lead_id', { count: 'exact' })
      .gte('created_at', previousStartTs)
      .lt('created_at', previousEndTs),
    supabase.from('api_v1_lead_lifecycle').select('lifecycle_status').gte('created_at', currentStartTs),
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
    leadStatusRes.error ||
    funnelCurrentRes.error ||
    funnelPreviousRes.error ||
    deadLettersRes.error ||
    healthRes.error;
  if (firstError) throw firstError;

  const profiles = profileRes.data || [];
  const facilities = profiles.length;
  const avgProfile = facilities > 0 ? profiles.reduce((s, r) => s + Number(r.profile_strength_score || 0), 0) / facilities : 0;
  const avgConfidence = facilities > 0 ? profiles.reduce((s, r) => s + Number(r.confidence_score || 0), 0) / facilities : 0;

  const leadsCurrent = leadsCurrentRes.count || 0;
  const leadsPrevious = leadsPreviousRes.count || 0;
  const leadsTrend = trend(leadsCurrent, leadsPrevious);

  const statuses = leadStatusRes.data || [];
  const movedIn = statuses.filter((s) => (s.lifecycle_status || '').toLowerCase() === 'resident_moved_in').length;
  const tours = statuses.filter((s) => (s.lifecycle_status || '').toLowerCase() === 'tour_scheduled').length;
  const estMoveIns = movedIn > 0 ? movedIn : Math.round(leadsCurrent * DEFAULT_MOVE_IN_RATE);
  const estRevenue = estMoveIns * DEFAULT_MONTHLY_RATE;

  const sumFunnel = (rows: Array<{ impressions: number | null; engagement: number | null; intent: number | null; conversions: number | null }>) =>
    rows.reduce(
      (acc, row) => ({
        impressions: acc.impressions + Number(row.impressions || 0),
        engagement: acc.engagement + Number(row.engagement || 0),
        intent: acc.intent + Number(row.intent || 0),
        conversions: acc.conversions + Number(row.conversions || 0),
      }),
      { impressions: 0, engagement: 0, intent: 0, conversions: 0 }
    );

  const funnelCurrent = sumFunnel(funnelCurrentRes.data || []);
  const funnelPrevious = sumFunnel(funnelPreviousRes.data || []);
  const intentToConversionCurrent = funnelCurrent.intent > 0 ? (funnelCurrent.conversions / funnelCurrent.intent) * 100 : 0;
  const intentToConversionPrevious = funnelPrevious.intent > 0 ? (funnelPrevious.conversions / funnelPrevious.intent) * 100 : 0;

  const deadLetters = deadLettersRes.count || 0;
  const health = (healthRes.data?.[0] || {
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

  const rawLag = minutesSince(health.latest_raw_ingested_at);
  const normLag = minutesSince(health.latest_normalized_at);
  const readLag = minutesSince(health.latest_read_model_refresh_at);

  let reliability = 100;
  if (deadLetters > 0) reliability -= Math.min(35, deadLetters * 2);
  if (health.pending_raw_events > MAX_PENDING) reliability -= 20;
  if (rawLag !== null && rawLag > RAW_MAX_MINUTES) reliability -= 15;
  if (normLag !== null && normLag > NORMALIZED_MAX_MINUTES) reliability -= 15;
  if (readLag !== null && readLag > READ_MODEL_MAX_MINUTES) reliability -= 15;
  reliability = Math.max(0, reliability);

  const actions: string[] = [];
  if (avgProfile < 70) actions.push(`Raise average profile strength from ${avgProfile.toFixed(1)} to 80+ via photos/pricing/amenities.`);
  if (leadsTrend < 0) actions.push(`Lead volume declined ${pct(leadsTrend)}. Audit acquisition channels and response speed.`);
  if (intentToConversionCurrent < 10 && funnelCurrent.intent > 0) actions.push(`Intent-to-conversion is ${intentToConversionCurrent.toFixed(1)}%. Prioritize tour booking funnel and follow-up.`);
  if (deadLetters > 0) actions.push(`Clear ${deadLetters} dead letters and patch recurring normalization failures.`);
  if (reliability < 85) actions.push(`Pipeline reliability score is ${reliability}/100. Review lag thresholds and job cadence.`);
  if (actions.length === 0) actions.push('No major blockers. Keep automation cadence and continue optimization.');

  const lines = [
    'SilverTech Monthly Founder Board Digest',
    `Generated: ${new Date().toISOString()}`,
    '',
    'Board Metrics (30d vs prior 30d):',
    `- Facilities indexed: ${num(facilities)}`,
    `- Lead volume: ${num(leadsCurrent)} (prev ${num(leadsPrevious)}, trend ${pct(leadsTrend)})`,
    `- Estimated move-ins: ${num(estMoveIns)} (explicit moved-in=${num(movedIn)}, tours scheduled=${num(tours)})`,
    `- Estimated monthly revenue influence: ${usd(estRevenue)} (assumption: ${usd(DEFAULT_MONTHLY_RATE)}/move-in)`,
    `- Avg profile strength: ${avgProfile.toFixed(1)}/100`,
    `- Avg canonical confidence: ${(avgConfidence * 100).toFixed(1)}%`,
    `- Funnel intent->conversion: ${intentToConversionCurrent.toFixed(1)}% (prev ${intentToConversionPrevious.toFixed(1)}%)`,
    '',
    'Reliability:',
    `- Pipeline reliability score: ${reliability}/100`,
    `- Pending raw events: ${health.pending_raw_events}`,
    `- Dead letters: ${deadLetters}`,
    `- Raw lag (min): ${rawLag ?? 'n/a'}`,
    `- Normalization lag (min): ${normLag ?? 'n/a'}`,
    `- Read-model lag (min): ${readLag ?? 'n/a'}`,
    '',
    'Top Founder Actions:',
    ...actions.map((a, i) => `${i + 1}. ${a}`),
    '',
    'Assumptions:',
    `- Default move-in rate used when explicit moved-in status is low: ${(DEFAULT_MOVE_IN_RATE * 100).toFixed(1)}%`,
    `- Default monthly rate per move-in: ${usd(DEFAULT_MONTHLY_RATE)}`,
  ];

  const digest = lines.join('\n');
  console.log(digest);
  if (SHOULD_NOTIFY) await sendWebhook(digest);
};

main().catch(async (err) => {
  const message = `Founder monthly digest crashed: ${String(err)}`;
  console.error(message);
  if (SHOULD_NOTIFY) {
    try {
      await sendWebhook(message);
    } catch {
      // no-op
    }
  }
  process.exit(1);
});

