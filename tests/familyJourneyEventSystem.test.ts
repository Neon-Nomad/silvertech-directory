import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260321133000_add_family_journey_event_system.sql',
);

const contractPath = path.resolve(process.cwd(), 'data-contract.yaml');
const apiContractPath = path.resolve(process.cwd(), 'docs/family_journey_api_contracts.md');

describe('family journey event system foundation', () => {
  it('defines family journey contract in data-contract.yaml', () => {
    const yaml = fs.readFileSync(contractPath, 'utf8');
    const contract = parse(yaml) as {
      family_journey?: {
        status_flow?: string[];
        terminal_status?: string[];
        event_tables?: string[];
        idempotency?: { table?: string; required_actions?: string[] };
        resolver?: { source?: string; order_by?: string[] };
      };
    };

    expect(contract.family_journey?.status_flow).toEqual(
      expect.arrayContaining(['researching', 'touring', 'shortlist', 'selected', 'moved_in']),
    );
    expect(contract.family_journey?.terminal_status).toEqual(expect.arrayContaining(['moved_in']));
    expect(contract.family_journey?.event_tables).toEqual(
      expect.arrayContaining([
        'saved_facilities',
        'facility_status_history',
        'facility_notes',
        'tour_logs',
        'move_ins',
        'attribution',
      ]),
    );
    expect(contract.family_journey?.idempotency?.table).toBe('idempotency_keys');
    expect(contract.family_journey?.idempotency?.required_actions).toEqual(
      expect.arrayContaining(['save', 'status', 'move_in', 'attribution']),
    );
    expect(contract.family_journey?.resolver?.source).toBe('current_facility_status');
    expect(contract.family_journey?.resolver?.order_by).toEqual(
      expect.arrayContaining(['created_at DESC', 'id DESC']),
    );
  });

  it('creates deterministic status history and resolver view', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain("create type public.family_journey_status as enum");
    expect(sql).toContain('create table if not exists public.facility_status_history');
    expect(sql).toContain("action_type text not null default 'status'");
    expect(sql).toContain('create index if not exists idx_status_resolver');
    expect(sql).toContain('create or replace view public.current_facility_status as');
    expect(sql).toContain('select distinct on (user_id, facility_id)');
    expect(sql).toContain('order by user_id, facility_id, created_at desc, id desc;');
  });

  it('enforces append-only status events and transition validation at DB level', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create or replace function public.validate_status_transition()');
    expect(sql).toContain("raise exception 'Terminal state reached'");
    expect(sql).toContain("raise exception 'moved_in requires selected as previous status'");
    expect(sql).toContain('create trigger trg_validate_status_transition');
    expect(sql).toContain('create or replace function public.prevent_status_history_mutation()');
    expect(sql).toContain('create trigger trg_prevent_status_history_mutation');
    expect(sql).toContain("raise exception 'facility_status_history is append-only'");
  });

  it('ships centralized idempotency registry and required per-action keys', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create table if not exists public.idempotency_keys');
    expect(sql).toContain('primary key (user_id, action_type, idempotency_key)');
    expect(sql).toContain('create unique index if not exists idx_saved_facilities_idempotency');
    expect(sql).toContain('create unique index if not exists idx_facility_status_history_idempotency');
    expect(sql).toContain('create unique index if not exists idx_move_ins_idempotency');
    expect(sql).toContain('create unique index if not exists idx_attribution_idempotency');
  });

  it('creates family event tables with own-row RLS and ownership policies', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create table if not exists public.saved_facilities');
    expect(sql).toContain('create table if not exists public.facility_notes');
    expect(sql).toContain('create table if not exists public.tour_logs');
    expect(sql).toContain('create table if not exists public.move_ins');
    expect(sql).toContain('create table if not exists public.attribution');
    expect(sql).toContain('create unique index if not exists uniq_note_per_facility');
    expect(sql).toContain('alter table public.saved_facilities enable row level security;');
    expect(sql).toContain('create policy "Users can read own saved facilities"');
    expect(sql).toContain('create policy "Users can insert own status history"');
    expect(sql).toContain('create policy "Users can insert own move ins"');
  });

  it('defines a single dashboard snapshot query contract', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const apiContract = fs.readFileSync(apiContractPath, 'utf8');

    expect(sql).toContain('create or replace view public.family_dashboard_snapshot as');
    expect(sql).toContain('left join public.current_facility_status cs');
    expect(sql).toContain('left join lateral (');
    expect(sql).toContain('order by tour_at asc');
    expect(apiContract).toContain('sort by (created_at ASC, local_sequence ASC)');
    expect(apiContract).toContain('POST /api/family/move-in');
    expect(apiContract).toContain('{ "status": "already_exists" }');
  });
});
