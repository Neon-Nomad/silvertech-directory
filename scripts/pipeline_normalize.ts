import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = Number(process.env.PIPELINE_NORMALIZE_BATCH_SIZE || 200);
const MAX_BATCHES = Number(process.env.PIPELINE_NORMALIZE_MAX_BATCHES || 20);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type PendingRawEvent = {
  raw_event_id: string;
  source_system: string;
  canonical_entity: string;
  schema_version: string;
  occurred_at: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const asString = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null);

const toDedupeKey = (entity: string, payload: Record<string, unknown>, sourceEventId: string) => {
  const facilityId = asString(payload.facility_id);
  const leadId = asString(payload.lead_id);
  const sessionId = asString(payload.session_id);

  if (entity === 'facility' && facilityId) return `facility:${facilityId}`;
  if (entity === 'lead' && leadId) return `lead:${leadId}`;
  if (entity === 'lead_event') {
    if (facilityId && sessionId) return `lead_event:${facilityId}:${sessionId}:${sourceEventId}`;
    if (sessionId) return `lead_event:${sessionId}:${sourceEventId}`;
  }
  return `${entity}:${sourceEventId}`;
};

const upsertCanonical = async (evt: PendingRawEvent) => {
  const payload = asObject(evt.payload);
  const metadata = asObject(evt.metadata);
  const sourceEventId = evt.raw_event_id;
  const dedupeKey = toDedupeKey(evt.canonical_entity, payload, sourceEventId);

  if (evt.canonical_entity === 'facility') {
    const row = {
      facility_id: asString(payload.facility_id),
      source_system: evt.source_system,
      schema_version: evt.schema_version,
      dedupe_key: dedupeKey,
      canonical_payload: payload,
      confidence_score: Number(payload.confidence_score ?? 0.75),
      pii_present: false,
      last_normalized_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('canonical_facility_records')
      .upsert(row, { onConflict: 'dedupe_key' })
      .select('id')
      .single();
    if (error) throw error;
    return { table: 'canonical_facility_records', id: data.id, dedupeKey, confidence: row.confidence_score };
  }

  if (evt.canonical_entity === 'lead') {
    const analyticsPayload = asObject(payload.analytics_payload);
    const row = {
      lead_id: asString(payload.lead_id),
      source_system: evt.source_system,
      schema_version: evt.schema_version,
      dedupe_key: dedupeKey,
      canonical_payload: payload,
      analytics_payload: analyticsPayload,
      confidence_score: Number(payload.confidence_score ?? 0.7),
      pii_present: true,
      last_normalized_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('canonical_lead_records')
      .upsert(row, { onConflict: 'dedupe_key' })
      .select('id')
      .single();
    if (error) throw error;
    return { table: 'canonical_lead_records', id: data.id, dedupeKey, confidence: row.confidence_score };
  }

  if (evt.canonical_entity === 'lead_event') {
    const row = {
      raw_event_id: evt.raw_event_id,
      facility_id: asString(payload.facility_id) || asString(metadata.facility_id),
      lead_id: asString(payload.lead_id) || asString(metadata.lead_id),
      session_id: asString(payload.session_id) || asString(metadata.session_id),
      source_system: evt.source_system,
      schema_version: evt.schema_version,
      event_type: asString(payload.event_type) || asString(metadata.event_type) || 'unknown',
      occurred_at: evt.occurred_at,
      canonical_payload: payload,
      confidence_score: Number(payload.confidence_score ?? 0.8),
    };

    const { data, error } = await supabase
      .from('canonical_lead_event_records')
      .upsert(row, { onConflict: 'raw_event_id' })
      .select('id')
      .single();
    if (error) throw error;
    return { table: 'canonical_lead_event_records', id: data.id, dedupeKey, confidence: row.confidence_score };
  }

  const row = {
    p_raw_event_id: evt.raw_event_id,
    p_canonical_entity: evt.canonical_entity,
    p_status: 'normalized',
    p_normalized_table: null,
    p_normalized_record_id: null,
    p_dedupe_key: dedupeKey,
    p_confidence_score: Number(payload.confidence_score ?? 0.6),
    p_processing_error: null,
    p_run_id: null,
    p_metadata: { skipped: true, reason: 'unsupported_entity' },
  };
  const { error } = await supabase.rpc('record_normalization_result', row);
  if (error) throw error;
  return { table: null, id: null, dedupeKey, confidence: row.confidence_score };
};

const linkIdentity = async (evt: PendingRawEvent, normalizedRecordId: string | null, dedupeKey: string, confidence: number) => {
  if (!normalizedRecordId) return;

  const row = {
    canonical_entity: evt.canonical_entity,
    canonical_record_id: normalizedRecordId,
    raw_event_id: evt.raw_event_id,
    dedupe_key: dedupeKey,
    confidence_score: confidence,
    metadata: {},
  };

  const { error } = await supabase
    .from('canonical_identity_links')
    .upsert(row, { onConflict: 'canonical_entity,dedupe_key' });
  if (error) throw error;
};

const main = async () => {
  const { data: run, error: runError } = await supabase
    .from('normalization_runs')
    .insert({ source_system: 'system', status: 'running', metadata: {} })
    .select('id')
    .single();
  if (runError) throw runError;
  const runId = run.id as string;

  let scanned = 0;
  let normalized = 0;
  let rejected = 0;

  for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
    const { data, error } = await supabase.rpc('get_pending_raw_events_for_normalization', { p_limit: BATCH_SIZE });
    if (error) throw error;
    const events = (data || []) as PendingRawEvent[];
    if (events.length === 0) break;

    for (const evt of events) {
      scanned += 1;
      try {
        const result = await upsertCanonical(evt);
        await linkIdentity(evt, result.id, result.dedupeKey, result.confidence);

        const { error: statusError } = await supabase.rpc('record_normalization_result', {
          p_raw_event_id: evt.raw_event_id,
          p_canonical_entity: evt.canonical_entity,
          p_status: 'normalized',
          p_normalized_table: result.table,
          p_normalized_record_id: result.id,
          p_dedupe_key: result.dedupeKey,
          p_confidence_score: result.confidence,
          p_processing_error: null,
          p_run_id: runId,
          p_metadata: {},
        });
        if (statusError) throw statusError;
        normalized += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await supabase.rpc('record_normalization_result', {
          p_raw_event_id: evt.raw_event_id,
          p_canonical_entity: evt.canonical_entity,
          p_status: 'rejected',
          p_normalized_table: null,
          p_normalized_record_id: null,
          p_dedupe_key: null,
          p_confidence_score: null,
          p_processing_error: message,
          p_run_id: runId,
          p_metadata: {},
        });
        rejected += 1;
      }
    }
  }

  const { error: closeError } = await supabase
    .from('normalization_runs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      records_scanned: scanned,
      records_normalized: normalized,
      records_rejected: rejected,
    })
    .eq('id', runId);
  if (closeError) throw closeError;

  console.log(`Normalization complete. run_id=${runId} scanned=${scanned} normalized=${normalized} rejected=${rejected}`);
};

main().catch((err) => {
  console.error('pipeline_normalize failed:', err);
  process.exit(1);
});
