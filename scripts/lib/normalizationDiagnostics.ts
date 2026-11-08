// Failure diagnostics for the normalization pipeline. Pure functions: no I/O, no payloads, no credentials.
//
// Every failure is classified before anything is written:
// - transient: retry later. The event is left pending and nothing is recorded for it.
// - permanent: the event itself is invalid. It is recorded as rejected, with structured diagnostics.
// - systemic: the schema, permissions or credentials are wrong. The run stops before writing any rejection.

export type FailureKind = 'transient' | 'permanent' | 'systemic';

export type FailureDiagnostic = {
  kind: FailureKind;
  code: string | null;
  message: string;
};

const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]{0,62}$/;

export const MAX_MESSAGE_LENGTH = 300;
export const MAX_PROCESSING_ERROR_LENGTH = 600;

const TRANSIENT_CODES = new Set(['40001', '40P01', '57014', '53300', '57P01', 'PGRST301']);
const SYSTEMIC_CODE = /^(42|PGRST20\d)/;
const PERMANENT_CODE = /^(22|23|P0001)/;
const TRANSIENT_MESSAGE = /fetch failed|ECONNRESET|ECONNREFUSED|ETIMEDOUT|socket hang up|network|timed out|503|502|504|429/i;
const SYSTEMIC_MESSAGE = /JWT|invalid api key|permission denied|not authorized to execute|schema cache|could not find the function/i;

// Removes values that could carry personal data or credentials before a message is stored or logged.
export const redact = (text: string): string =>
  text
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]')
    .replace(/[(]?\d{3}[)]?[-. ]\d{3}[-. ]\d{4}/g, '[phone]')
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[token]')
    .replace(/\b(sb_secret_|sbp_|sk_live_|sk_test_|rk_live_|xkeysib-)[A-Za-z0-9_-]+/g, '[credential]')
    .replace(/\(([^()]{1,120})\)=\(([^()]{1,200})\)/g, '($1)=([value])')
    // Quoted identifiers such as table names are kept. Any other quoted text is treated as a value.
    .replace(/"([^"]{1,200})"/g, (match, inner: string) => (SAFE_IDENTIFIER.test(inner) ? match : '"[value]"'));

const truncate = (text: string, max: number): string => (text.length > max ? `${text.slice(0, max - 3)}...` : text);

const fieldText = (value: unknown): string => (typeof value === 'string' ? value : '');

// Supabase/PostgREST errors are plain objects, not Error instances. Reading only their known fields avoids "[object Object]".
const extract = (err: unknown): { code: string | null; message: string } => {
  if (err instanceof Error) {
    const code = fieldText((err as Error & { code?: unknown }).code) || null;
    return { code, message: err.message || err.name };
  }
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const code = fieldText(e.code) || null;
    const parts = [fieldText(e.message), fieldText(e.details), fieldText(e.hint)].filter(Boolean);
    if (parts.length > 0) return { code, message: parts.join(' | ') };
    return { code, message: `unrecognised error object with keys: ${Object.keys(e).slice(0, 8).join(', ') || 'none'}` };
  }
  return { code: null, message: typeof err === 'string' ? err : `unrecognised error value of type ${typeof err}` };
};

export const classifyFailure = (code: string | null, message: string): FailureKind => {
  if (code && TRANSIENT_CODES.has(code)) return 'transient';
  if (code && SYSTEMIC_CODE.test(code)) return 'systemic';
  if (code && PERMANENT_CODE.test(code)) return 'permanent';
  if (!code && SYSTEMIC_MESSAGE.test(message)) return 'systemic';
  if (!code && TRANSIENT_MESSAGE.test(message)) return 'transient';
  if (code === '42501') return 'systemic';
  return 'transient';
};

export const describeFailure = (err: unknown): FailureDiagnostic => {
  const { code, message } = extract(err);
  return {
    kind: classifyFailure(code, message),
    code,
    message: truncate(redact(message), MAX_MESSAGE_LENGTH),
  };
};

// The value stored in normalization_records.processing_error. Stable keys, bounded size, no payload.
export const formatProcessingError = (diag: FailureDiagnostic): string =>
  truncate(
    JSON.stringify({ v: 1, kind: diag.kind, code: diag.code, message: diag.message }),
    MAX_PROCESSING_ERROR_LENGTH
  );

// Keeps only the events not already handled earlier in this run, so a batch cannot process the same event twice.
export const planBatch = <T extends { raw_event_id: string }>(events: T[], seen: Set<string>): T[] => {
  const fresh: T[] = [];
  for (const evt of events) {
    if (seen.has(evt.raw_event_id)) continue;
    seen.add(evt.raw_event_id);
    fresh.push(evt);
  }
  return fresh;
};

// Share of a batch that may be rejected before the run stops for review. 1% of a 200-event batch is 2 events.
export const MAX_REJECTION_RATE = 0.01;

export type BatchOutcome = {
  fresh: number;
  statusWritten: number;
  rejected: number;
  transient: number;
  systemic: number;
  rejectionWriteFailed: number;
  duplicates: number;
};

export type BatchDecision = { action: 'abort' | 'stop' | 'continue'; reason: string };

// Decides what the loop does after a batch.
// - abort (the run is marked failed): systemic failures, rejections that could not be recorded, and duplicates,
//   which mean the backlog query returned an event twice.
// - stop (the run completes with a stop reason): any transient failure. Pending events come back in ingestion order
//   with no offset, so a transient event at the front would be fetched again on every batch. The next run retries it.
//   Also stops on excessive rejections, nothing new, or nothing written.
export const nextBatchAction = (outcome: BatchOutcome): BatchDecision => {
  if (outcome.systemic > 0) return { action: 'abort', reason: 'systemic_failure' };
  if (outcome.rejectionWriteFailed > 0) return { action: 'abort', reason: 'rejection_write_failed' };
  if (outcome.duplicates > 0) return { action: 'abort', reason: 'duplicate_detected' };
  if (outcome.transient > 0) return { action: 'stop', reason: 'transient_failure' };
  if (outcome.rejected > outcome.fresh * MAX_REJECTION_RATE) return { action: 'stop', reason: 'excessive_rejections' };
  if (outcome.fresh === 0) return { action: 'stop', reason: 'no_fresh_events' };
  if (outcome.statusWritten === 0) return { action: 'stop', reason: 'no_progress' };
  return { action: 'continue', reason: 'batch_clean' };
};
