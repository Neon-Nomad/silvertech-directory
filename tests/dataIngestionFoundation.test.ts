import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260215170000_add_data_ingestion_foundation.sql'
);

const contractPath = path.resolve(process.cwd(), 'data-contract.yaml');

describe('data ingestion foundation contract', () => {
  it('defines canonical entities and idempotency requirements', () => {
    const yaml = fs.readFileSync(contractPath, 'utf8');
    const contract = parse(yaml) as {
      version?: string;
      entities?: Record<string, unknown>;
      event_contract?: { required_fields?: string[]; idempotency_key?: string[] };
      raw_layer?: { append_only_tables?: string[] };
    };

    expect(contract.version).toBeTruthy();
    expect(contract.entities).toBeDefined();
    expect(Object.keys(contract.entities || {})).toEqual(
      expect.arrayContaining([
        'facility',
        'lead',
        'lead_event',
        'facility_profile',
        'qa_question',
        'qa_answer',
        'billing_event',
      ])
    );

    expect(contract.event_contract?.required_fields).toEqual(
      expect.arrayContaining([
        'schema_version',
        'source_system',
        'canonical_entity',
        'occurred_at',
        'payload',
      ])
    );
    expect(contract.event_contract?.idempotency_key).toEqual(['source_system', 'source_event_id']);
    expect(contract.raw_layer?.append_only_tables).toEqual(
      expect.arrayContaining(['raw_events', 'raw_source_snapshots'])
    );
  });

  it('creates append-only raw ingestion tables and enums', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain("create type public.ingestion_source_system as enum");
    expect(sql).toContain("create type public.canonical_entity_kind as enum");
    expect(sql).toContain("create type public.ingestion_record_status as enum");
    expect(sql).toContain("create table if not exists public.raw_events");
    expect(sql).toContain("create table if not exists public.raw_source_snapshots");
    expect(sql).toContain("create table if not exists public.ingestion_batches");
    expect(sql).toContain("create trigger trg_raw_events_append_only");
    expect(sql).toContain("create trigger trg_raw_source_snapshots_append_only");
  });

  it('enforces idempotent ingest and exposes controlled ingest RPC', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain("create unique index if not exists idx_raw_events_source_event_unique");
    expect(sql).toContain("on conflict (source_system, source_event_id)");
    expect(sql).toContain("create or replace function public.ingest_raw_event(");
    expect(sql).toContain("Anonymous ingest is restricted to web lead signals");
    expect(sql).toContain("grant execute on function public.ingest_raw_event(");
  });
});

