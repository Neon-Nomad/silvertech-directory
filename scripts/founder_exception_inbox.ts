import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_URL = process.env.FOUNDER_DAILY_WEBHOOK_URL || process.env.ALERT_WEBHOOK_URL || '';

const MAX_PENDING = Number(process.env.PIPELINE_MAX_PENDING_EVENTS || 500);
const RAW_MAX_MINUTES = Number(process.env.PIPELINE_RAW_MAX_MINUTES || 180);
const NORMALIZED_MAX_MINUTES = Number(process.env.PIPELINE_NORMALIZED_MAX_MINUTES || 240);
const READ_MODEL_MAX_MINUTES = Number(process.env.PIPELINE_READ_MODEL_MAX_MINUTES || 360);
const DEADLETTER_PREVIEW_LIMIT = Number(process.env.FOUNDER_DEADLETTER_PREVIEW_LIMIT || 10);
const SEND_WEBHOOK = process.argv.includes('--notify') || process.env.FOUNDER_EXCEPTIONS_NOTIFY === 'true';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const minutesSince = (iso: string | null) => {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
};

const sendWebhook = async (text: string) => {
  if (!WEBHOOK_URL) return;
  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      app: 'silvertech-directory',
      scope: 'founder-exception-inbox',
      timestamp: new Date().toISOString(),
    }),
  });
};

const main = async () => {
  const exceptions: string[] = [];

  const { data: healthRows, error: healthError } = await supabase.rpc('get_data_pipeline_health');
  if (healthError) throw healthError;

  const health = healthRows?.[0] as
    | {
        pending_raw_events: number;
        latest_raw_ingested_at: string | null;
        latest_normalized_at: string | null;
        latest_read_model_refresh_at: string | null;
      }
    | undefined;

  if (!health) {
    throw new Error('No pipeline health snapshot available');
  }

  const rawLag = minutesSince(health.latest_raw_ingested_at);
  const normLag = minutesSince(health.latest_normalized_at);
  const readLag = minutesSince(health.latest_read_model_refresh_at);

  if (health.pending_raw_events > MAX_PENDING) {
    exceptions.push(
      `Pipeline backlog high: ${health.pending_raw_events} pending (max ${MAX_PENDING}). Action: run founder:daily.`
    );
  }
  if (rawLag !== null && rawLag > RAW_MAX_MINUTES) {
    exceptions.push(`Raw ingestion lag ${rawLag}m exceeds ${RAW_MAX_MINUTES}m. Action: check ingestion sources.`);
  }
  if (normLag !== null && normLag > NORMALIZED_MAX_MINUTES) {
    exceptions.push(
      `Normalization lag ${normLag}m exceeds ${NORMALIZED_MAX_MINUTES}m. Action: inspect normalization job logs.`
    );
  }
  if (readLag !== null && readLag > READ_MODEL_MAX_MINUTES) {
    exceptions.push(
      `Read-model lag ${readLag}m exceeds ${READ_MODEL_MAX_MINUTES}m. Action: run pipeline:refresh-models.`
    );
  }

  const { data: deadLetters, error: deadLetterError } = await supabase
    .from('normalization_dead_letters')
    .select('raw_event_id, canonical_entity, source_system, attempts, last_error, dead_lettered_at')
    .order('dead_lettered_at', { ascending: false })
    .limit(Math.max(1, Math.min(DEADLETTER_PREVIEW_LIMIT, 50)));

  if (deadLetterError) throw deadLetterError;

  if ((deadLetters || []).length > 0) {
    exceptions.push(
      `Dead letters present: ${(deadLetters || []).length}+ latest records require review/retry. Action: run pipeline:retry and inspect dead-letter causes.`
    );
  }

  const lines: string[] = [];
  lines.push('SilverTech Founder Exception Inbox');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(
    `Pipeline health snapshot: pending=${health.pending_raw_events}, rawLagMin=${rawLag ?? 'n/a'}, normalizedLagMin=${normLag ?? 'n/a'}, readModelLagMin=${readLag ?? 'n/a'}`
  );

  if (health.pending_raw_events === 0 && rawLag === null && normLag === null && readLag === null) {
    lines.push('No pipeline activity recorded yet. This is normal for a fresh or idle environment.');
  }

  if (exceptions.length === 0) {
    lines.push('No actionable exceptions detected.');
  } else {
    lines.push('Actionable exceptions:');
    for (const exception of exceptions) {
      lines.push(`- ${exception}`);
    }
  }

  if ((deadLetters || []).length > 0) {
    lines.push('Recent dead-letter preview:');
    for (const row of deadLetters || []) {
      lines.push(
        `- ${row.dead_lettered_at} | ${row.canonical_entity} | source=${row.source_system || 'unknown'} | attempts=${row.attempts} | raw_event_id=${row.raw_event_id} | error=${row.last_error}`
      );
    }
  }

  const summary = lines.join('\n');
  console.log(summary);

  if (SEND_WEBHOOK) {
    await sendWebhook(summary);
  }

  if (exceptions.length > 0) {
    process.exitCode = 1;
  }
};

main().catch(async (err) => {
  const message = `Founder exception inbox crashed: ${String(err)}`;
  console.error(message);
  if (SEND_WEBHOOK) {
    try {
      await sendWebhook(message);
    } catch {
      // Ignore webhook errors in crash path.
    }
  }
  process.exit(1);
});
