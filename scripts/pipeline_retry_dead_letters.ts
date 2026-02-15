import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const MAX_ATTEMPTS = Number(process.env.PIPELINE_NORMALIZE_MAX_ATTEMPTS || 5);
const RETRY_BASE_MINUTES = Number(process.env.PIPELINE_RETRY_BASE_MINUTES || 15);
const BATCH_LIMIT = Number(process.env.PIPELINE_RETRY_BATCH_LIMIT || 1000);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type RejectedRecord = {
  raw_event_id: string;
  canonical_entity: string;
  attempts: number;
  last_processed_at: string;
  processing_error: string | null;
  next_retry_at: string | null;
};

const isoAfterMinutes = (baseIso: string, minutes: number) => {
  const d = new Date(baseIso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
};

const main = async () => {
  const now = new Date();

  const { data, error } = await supabase
    .from('normalization_records')
    .select('raw_event_id,canonical_entity,attempts,last_processed_at,processing_error,next_retry_at')
    .eq('status', 'rejected')
    .is('dead_lettered_at', null)
    .order('last_processed_at', { ascending: true })
    .limit(BATCH_LIMIT);

  if (error) throw error;
  const records = (data || []) as RejectedRecord[];

  let retryMarked = 0;
  let retryDeferred = 0;
  let deadLettered = 0;

  for (const rec of records) {
    if (rec.attempts >= MAX_ATTEMPTS) {
      const { error: dlError } = await supabase.rpc('dead_letter_normalization_record', {
        p_raw_event_id: rec.raw_event_id,
        p_reason: `retry budget exhausted at attempts=${rec.attempts}`,
        p_metadata: { source: 'pipeline_retry_dead_letters' },
      });
      if (dlError) throw dlError;
      deadLettered += 1;
      continue;
    }

    const backoffMinutes = RETRY_BASE_MINUTES * Math.pow(2, Math.max(rec.attempts - 1, 0));
    const eligibleAtIso = isoAfterMinutes(rec.last_processed_at, backoffMinutes);
    const isEligible = now >= new Date(eligibleAtIso);

    if (isEligible) {
      const { data: marked, error: markError } = await supabase.rpc('mark_normalization_record_retryable', {
        p_raw_event_id: rec.raw_event_id,
        p_next_retry_at: now.toISOString(),
      });
      if (markError) throw markError;
      if (marked) retryMarked += 1;
      continue;
    }

    const { error: deferError } = await supabase
      .from('normalization_records')
      .update({ next_retry_at: eligibleAtIso })
      .eq('raw_event_id', rec.raw_event_id);
    if (deferError) throw deferError;
    retryDeferred += 1;
  }

  console.log(
    `Retry pass complete. total=${records.length} retry_marked=${retryMarked} deferred=${retryDeferred} dead_lettered=${deadLettered}`
  );
};

main().catch((err) => {
  console.error('pipeline_retry_dead_letters failed:', err);
  process.exit(1);
});

