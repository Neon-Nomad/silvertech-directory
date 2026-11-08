import { beforeEach, describe, expect, it, vi } from 'vitest';

// Runs the real pipeline loop against a fake Supabase client, so each stop condition is checked end to end.
const fake = vi.hoisted(() => ({
  batches: [] as unknown[][],
  upsertError: null as unknown,
  rejectionError: null as unknown,
  runUpdates: [] as Record<string, unknown>[],
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: async (name: string, args: Record<string, unknown>) => {
      if (name === 'get_pending_raw_events_for_normalization') return { data: fake.batches.shift() ?? [], error: null };
      if (name === 'record_normalization_result') {
        return { error: args.p_status === 'rejected' ? fake.rejectionError : null };
      }
      throw new Error(`unexpected rpc: ${name}`);
    },
    from: (table: string) => ({
      insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'run-1' }, error: null }) }) }),
      update: (values: Record<string, unknown>) => {
        if (table === 'normalization_runs') fake.runUpdates.push(values);
        return { eq: async () => ({ error: null }) };
      },
      upsert: () => {
        const result = () => (fake.upsertError ? { data: null, error: fake.upsertError } : { data: { id: 'c-1' }, error: null });
        return Object.assign(Promise.resolve({ error: null }), { select: () => ({ single: async () => result() }) });
      },
    }),
  }),
}));

const event = (id: string) => ({
  raw_event_id: id,
  source_system: 'test',
  canonical_entity: 'lead_event',
  schema_version: '1',
  occurred_at: '2026-11-08T00:00:00Z',
  payload: { event_type: 'view' },
  metadata: {},
});

// Runs the pipeline once with the given batch size and batch cap, and returns what it logged and how it exited.
const runPipeline = async (maxBatches: number) => {
  vi.resetModules();
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  process.env.PIPELINE_NORMALIZE_BATCH_SIZE = '200';
  process.env.PIPELINE_NORMALIZE_MAX_BATCHES = String(maxBatches);

  const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await import('../scripts/pipeline_normalize');
    await vi.waitFor(() => {
      const finished =
        exit.mock.calls.length > 0 || logSpy.mock.calls.some((call) => String(call[0]).includes('normalization_run_summary'));
      if (!finished) throw new Error('pipeline has not finished');
    });
    const lines = logSpy.mock.calls.map((call) => String(call[0]));
    const summary = lines.map((line) => { try { return JSON.parse(line); } catch { return null; } })
      .find((line) => line?.event === 'normalization_run_summary');
    const events = lines.map((line) => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
    const finalUpdate = fake.runUpdates.filter((update) => 'status' in update).at(-1);
    return { exitCode: exit.mock.calls[0]?.[0], summary, events, finalUpdate, errors: errorSpy.mock.calls.length };
  } finally {
    exit.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  }
};

describe('pipeline batch guards, end to end', () => {
  beforeEach(() => {
    fake.batches = [];
    fake.upsertError = null;
    fake.rejectionError = null;
    fake.runUpdates = [];
  });

  it('processes batches up to the cap and records progress after each one', async () => {
    fake.batches = [[event('e1')], [event('e2')], [event('e3')]];
    const result = await runPipeline(2);
    expect(result.exitCode).toBeUndefined();
    expect(result.summary).toMatchObject({ batches: 2, scanned: 2, normalized: 2, rejected: 0, stop_reason: 'batch_limit_reached' });
    expect(result.finalUpdate).toMatchObject({ status: 'completed', metadata: { stop_reason: 'batch_limit_reached', batches: 2 } });
    expect(fake.batches).toHaveLength(1);
    const progressUpdates = fake.runUpdates.filter((update) => 'metadata' in update && (update.metadata as { progress?: boolean }).progress);
    expect(progressUpdates).toHaveLength(2);
  });

  it('stops when a batch has more than 1 percent rejections, and does not fetch the next batch', async () => {
    fake.upsertError = { code: '22P02', message: 'invalid input syntax for type uuid' };
    fake.batches = [[event('e1'), event('e2'), event('e3')], [event('e4')]];
    const result = await runPipeline(5);
    expect(result.exitCode).toBeUndefined();
    expect(result.summary).toMatchObject({ rejected: 3, stop_reason: 'excessive_rejections' });
    expect(result.finalUpdate).toMatchObject({ status: 'completed', metadata: { stop_reason: 'excessive_rejections' } });
    expect(fake.batches).toHaveLength(1);
  });

  it('aborts and marks the run failed when a rejection cannot be recorded', async () => {
    fake.upsertError = { code: '22P02', message: 'invalid input syntax for type uuid' };
    fake.rejectionError = { code: 'XX000', message: 'write failed' };
    fake.batches = [[event('e1')], [event('e2')]];
    const result = await runPipeline(5);
    expect(result.exitCode).toBe(1);
    expect(result.finalUpdate).toMatchObject({ status: 'failed', metadata: { stop_reason: 'rejection_write_failed' } });
    expect(result.events.some((line) => line.event === 'normalization_rejection_write_failed')).toBe(true);
    expect(fake.batches).toHaveLength(1);
  });

  it('aborts and marks the run failed on a systemic failure', async () => {
    fake.upsertError = { code: '42501', message: 'permission denied for table canonical_lead_event_records' };
    fake.batches = [[event('e1')], [event('e2')]];
    const result = await runPipeline(5);
    expect(result.exitCode).toBe(1);
    expect(result.finalUpdate).toMatchObject({ status: 'failed', metadata: { stop_reason: 'systemic_failure' } });
    expect(result.events.some((line) => line.event === 'normalization_systemic_failure')).toBe(true);
    expect(fake.batches).toHaveLength(1);
  });

  it('stops after a transient failure, leaving the event for the next run', async () => {
    fake.upsertError = { code: '57014', message: 'canceling statement due to statement timeout' };
    fake.batches = [[event('e1')], [event('e2')]];
    const result = await runPipeline(5);
    expect(result.exitCode).toBeUndefined();
    expect(result.summary).toMatchObject({ transient: 1, normalized: 0, stop_reason: 'transient_failure' });
    expect(result.finalUpdate).toMatchObject({ status: 'completed', metadata: { stop_reason: 'transient_failure' } });
    expect(fake.batches).toHaveLength(1);
  });

  it('aborts and marks the run failed when the backlog query returns a duplicate', async () => {
    fake.batches = [[event('e1'), event('e1')], [event('e2')]];
    const result = await runPipeline(5);
    expect(result.exitCode).toBe(1);
    expect(result.finalUpdate).toMatchObject({ status: 'failed', metadata: { stop_reason: 'duplicate_detected', duplicates: 1 } });
    expect(fake.batches).toHaveLength(1);
  });
});
