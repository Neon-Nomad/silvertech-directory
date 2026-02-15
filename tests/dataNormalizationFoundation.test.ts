import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260215173000_add_data_normalization_layer.sql'
);

describe('data normalization layer contract', () => {
  it('creates canonical and normalization ledger tables', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create table if not exists public.normalization_runs');
    expect(sql).toContain('create table if not exists public.normalization_records');
    expect(sql).toContain('create table if not exists public.canonical_facility_records');
    expect(sql).toContain('create table if not exists public.canonical_lead_records');
    expect(sql).toContain('create table if not exists public.canonical_lead_event_records');
    expect(sql).toContain('create table if not exists public.canonical_identity_links');
    expect(sql).toContain('unique (raw_event_id)');
    expect(sql).toContain('unique (canonical_entity, dedupe_key)');
  });

  it('enables service-role controlled RLS policies for normalization tables', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('alter table public.normalization_runs enable row level security;');
    expect(sql).toContain('alter table public.normalization_records enable row level security;');
    expect(sql).toContain('alter table public.canonical_facility_records enable row level security;');
    expect(sql).toContain('alter table public.canonical_lead_records enable row level security;');
    expect(sql).toContain('alter table public.canonical_lead_event_records enable row level security;');
    expect(sql).toContain('alter table public.canonical_identity_links enable row level security;');
    expect(sql).toContain('create policy "Service role manages normalization_records"');
    expect(sql).toContain('create policy "Service role manages canonical_identity_links"');
  });

  it('provides normalization RPC contract for recording results and polling pending events', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create or replace function public.record_normalization_result(');
    expect(sql).toContain('on conflict (raw_event_id)');
    expect(sql).toContain('attempts = normalization_records.attempts + 1');
    expect(sql).toContain('create or replace function public.get_pending_raw_events_for_normalization(');
    expect(sql).toContain("or nr.status in ('ingested', 'rejected')");
    expect(sql).toContain('grant execute on function public.record_normalization_result(');
    expect(sql).toContain('grant execute on function public.get_pending_raw_events_for_normalization(integer) to authenticated;');
  });
});

