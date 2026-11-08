import { describe, expect, it } from 'vitest';
import {
  MAX_MESSAGE_LENGTH,
  MAX_PROCESSING_ERROR_LENGTH,
  classifyFailure,
  describeFailure,
  formatProcessingError,
  nextBatchAction,
  planBatch,
  redact,
} from '../scripts/lib/normalizationDiagnostics';

// A PostgREST error as the Supabase client returns it: a plain object, not an Error instance.
const postgrestError = (code: string, message: string, details?: string) => ({ code, message, details: details ?? null, hint: null });

describe('describeFailure: readable messages', () => {
  it('reads the message and details of a plain PostgREST error object instead of printing [object Object]', () => {
    const diag = describeFailure(postgrestError('22P02', 'invalid input syntax for type uuid', 'Token "sess-1" is invalid'));
    expect(diag.message).not.toContain('[object Object]');
    expect(diag.message).toContain('invalid input syntax for type uuid');
    expect(diag.code).toBe('22P02');
  });

  it('reads a plain Error instance', () => {
    const diag = describeFailure(new Error('something went wrong'));
    expect(diag.message).toBe('something went wrong');
    expect(diag.code).toBeNull();
  });

  it('describes an unrecognised object by its keys, never by its values', () => {
    const diag = describeFailure({ weird: 'secret-value-123', other: 1 });
    expect(diag.message).toContain('weird');
    expect(diag.message).not.toContain('secret-value-123');
    expect(diag.message).not.toContain('[object Object]');
  });
});

describe('classification', () => {
  it('treats data and integrity errors as permanent for the event', () => {
    expect(classifyFailure('22P02', 'invalid input syntax for type uuid')).toBe('permanent');
    expect(classifyFailure('23503', 'insert or update violates foreign key constraint')).toBe('permanent');
    expect(classifyFailure('23502', 'null value in column violates not-null constraint')).toBe('permanent');
    expect(classifyFailure('P0001', 'Metadata must be a JSON object')).toBe('permanent');
  });

  it('treats timeouts, serialization conflicts and connection errors as transient', () => {
    expect(classifyFailure('57014', 'canceling statement due to statement timeout')).toBe('transient');
    expect(classifyFailure('40001', 'could not serialize access due to concurrent update')).toBe('transient');
    expect(classifyFailure(null, 'fetch failed')).toBe('transient');
    expect(classifyFailure(null, 'read ECONNRESET')).toBe('transient');
  });

  it('treats schema, permission and credential errors as systemic, so they never become per-event rejections', () => {
    expect(classifyFailure('42P01', 'relation "canonical_lead_event_records" does not exist')).toBe('systemic');
    expect(classifyFailure('42703', 'column "x" does not exist')).toBe('systemic');
    expect(classifyFailure('42501', 'permission denied for table raw_events')).toBe('systemic');
    expect(classifyFailure('PGRST202', 'Could not find the function')).toBe('systemic');
    expect(classifyFailure(null, 'Invalid API key')).toBe('systemic');
  });

  it('defaults an unclassified failure to transient, so the event is retried rather than rejected', () => {
    expect(classifyFailure(null, 'something unexpected')).toBe('transient');
  });
});

describe('redaction and bounds', () => {
  it('removes emails, phone numbers, tokens, credentials and quoted input values', () => {
    const raw = 'bad value "jane.doe@example.com" phone (512) 555-0199 token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijk key sb_secret_ABCDEFGH12345678';
    const out = redact(raw);
    expect(out).not.toContain('jane.doe@example.com');
    expect(out).not.toContain('555-0199');
    expect(out).not.toContain('eyJhbGci');
    expect(out).not.toContain('sb_secret_ABCDEFGH');
    expect(out).toContain('[phone]');
    expect(out).toContain('[credential]');
    expect(out).toContain('"[value]"');
  });

  it('keeps identifier-shaped quoted names such as table names, and redacts key values', () => {
    const out = redact('insert or update on table "re_facilities" violates foreign key | Key (facility_id)=(2578b820-0f9f-4032-9f44-6f19c2a970da) is not present');
    expect(out).toContain('"re_facilities"');
    expect(out).not.toContain('2578b820-0f9f-4032-9f44-6f19c2a970da');
    expect(out).toContain('(facility_id)=([value])');
  });

  it('bounds messages and the stored processing error', () => {
    const long = 'x'.repeat(5000);
    const diag = describeFailure(new Error(long));
    expect(diag.message.length).toBeLessThanOrEqual(MAX_MESSAGE_LENGTH);
    expect(formatProcessingError(diag).length).toBeLessThanOrEqual(MAX_PROCESSING_ERROR_LENGTH);
  });
});

describe('stored processing error', () => {
  it('is a stable JSON object with only the diagnostic fields, and no payload', () => {
    const diag = describeFailure(postgrestError('23503', 'foreign key violation', 'Key (facility_id)=(abc) is not present'));
    const stored = JSON.parse(formatProcessingError(diag));
    expect(Object.keys(stored).sort()).toEqual(['code', 'kind', 'message', 'v']);
    expect(stored.v).toBe(1);
    expect(stored.kind).toBe('permanent');
    expect(stored.code).toBe('23503');
  });
});

describe('duplicate processing within a run', () => {
  it('returns each event once even when a later batch contains it again', () => {
    const seen = new Set<string>();
    const first = planBatch([{ raw_event_id: 'a' }, { raw_event_id: 'b' }], seen);
    const second = planBatch([{ raw_event_id: 'b' }, { raw_event_id: 'c' }], seen);
    expect(first.map((e) => e.raw_event_id)).toEqual(['a', 'b']);
    expect(second.map((e) => e.raw_event_id)).toEqual(['c']);
  });

  it('drops a duplicate inside a single batch', () => {
    const fresh = planBatch([{ raw_event_id: 'a' }, { raw_event_id: 'a' }], new Set<string>());
    expect(fresh).toHaveLength(1);
  });
});

describe('batch decision', () => {
  const base = { fresh: 10, statusWritten: 10, transient: 0, systemic: 0 };

  it('continues when every fresh event was written', () => {
    expect(nextBatchAction(base)).toBe('continue');
  });

  it('aborts on any systemic failure', () => {
    expect(nextBatchAction({ ...base, systemic: 1 })).toBe('abort');
  });

  it('stops after a batch with any transient failure, so the next run retries it', () => {
    expect(nextBatchAction({ ...base, transient: 1, statusWritten: 9 })).toBe('stop');
  });

  it('stops when nothing new was fetched or nothing was written', () => {
    expect(nextBatchAction({ ...base, fresh: 0, statusWritten: 0 })).toBe('stop');
    expect(nextBatchAction({ ...base, statusWritten: 0 })).toBe('stop');
  });
});
