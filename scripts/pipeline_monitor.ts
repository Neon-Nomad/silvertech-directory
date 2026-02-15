import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL || '';

const MAX_PENDING = Number(process.env.PIPELINE_MAX_PENDING_EVENTS || 500);
const RAW_MAX_MINUTES = Number(process.env.PIPELINE_RAW_MAX_MINUTES || 180);
const NORMALIZED_MAX_MINUTES = Number(process.env.PIPELINE_NORMALIZED_MAX_MINUTES || 240);
const READ_MODEL_MAX_MINUTES = Number(process.env.PIPELINE_READ_MODEL_MAX_MINUTES || 360);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const minutesSince = (iso: string | null) => {
  if (!iso) return Number.POSITIVE_INFINITY;
  const diffMs = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
};

const sendAlert = async (message: string) => {
  if (!ALERT_WEBHOOK_URL) return;
  await fetch(ALERT_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message, app: 'silvertech-directory', scope: 'data-pipeline' }),
  });
};

const main = async () => {
  const { data, error } = await supabase.rpc('get_data_pipeline_health');
  if (error) throw error;

  const snapshot = data?.[0] as
    | {
        pending_raw_events: number;
        latest_raw_ingested_at: string | null;
        latest_normalized_at: string | null;
        latest_read_model_refresh_at: string | null;
      }
    | undefined;

  if (!snapshot) {
    throw new Error('No pipeline health snapshot returned');
  }

  const rawLag = minutesSince(snapshot.latest_raw_ingested_at);
  const normalizedLag = minutesSince(snapshot.latest_normalized_at);
  const readModelLag = minutesSince(snapshot.latest_read_model_refresh_at);

  const failures: string[] = [];
  if (snapshot.pending_raw_events > MAX_PENDING) {
    failures.push(`pending_raw_events=${snapshot.pending_raw_events} exceeds ${MAX_PENDING}`);
  }
  if (rawLag > RAW_MAX_MINUTES) {
    failures.push(`raw_lag_minutes=${rawLag} exceeds ${RAW_MAX_MINUTES}`);
  }
  if (normalizedLag > NORMALIZED_MAX_MINUTES) {
    failures.push(`normalized_lag_minutes=${normalizedLag} exceeds ${NORMALIZED_MAX_MINUTES}`);
  }
  if (readModelLag > READ_MODEL_MAX_MINUTES) {
    failures.push(`read_model_lag_minutes=${readModelLag} exceeds ${READ_MODEL_MAX_MINUTES}`);
  }

  const summary =
    `pending=${snapshot.pending_raw_events} ` +
    `rawLagMin=${rawLag} normalizedLagMin=${normalizedLag} readModelLagMin=${readModelLag}`;

  if (failures.length > 0) {
    const message = `Data pipeline monitor FAILED: ${summary}\n${failures.map((f) => `- ${f}`).join('\n')}`;
    console.error(message);
    await sendAlert(message);
    process.exit(1);
  }

  console.log(`Data pipeline monitor passed: ${summary}`);
};

main().catch(async (err) => {
  const message = `Data pipeline monitor crashed: ${String(err)}`;
  console.error(message);
  try {
    await sendAlert(message);
  } catch {
    // Ignore webhook errors in crash path.
  }
  process.exit(1);
});

