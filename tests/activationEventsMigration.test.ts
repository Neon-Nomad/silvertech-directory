import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260215213000_create_operator_activation_events.sql',
);
const contractPath = path.resolve(process.cwd(), 'data-contract.yaml');

describe('operator activation events migration contract', () => {
  it('defines activation analytics contract in data-contract.yaml', () => {
    const yaml = fs.readFileSync(contractPath, 'utf8');
    const contract = parse(yaml) as {
      activation_analytics?: {
        table?: string;
        required_fields?: string[];
        benchmark_thresholds?: { min_profile_views?: number; min_inquiries?: number };
      };
    };

    expect(contract.activation_analytics?.table).toBe('operator_activation_events');
    expect(contract.activation_analytics?.required_fields).toEqual(
      expect.arrayContaining([
        'operator_id',
        'facility_id',
        'session_id',
        'plan_tier',
        'activation_score',
        'source_screen',
        'occurred_at',
      ]),
    );
    expect(contract.activation_analytics?.benchmark_thresholds?.min_profile_views).toBe(25);
    expect(contract.activation_analytics?.benchmark_thresholds?.min_inquiries).toBe(5);
  });

  it('creates operator activation table with constraints, RLS and indexes', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create table if not exists public.operator_activation_events');
    expect(sql).toContain("event_name in (");
    expect(sql).toContain("plan_tier in ('free', 'premium', 'enterprise', 'unknown')");
    expect(sql).toContain('activation_score >= 0 and activation_score <= 100');
    expect(sql).toContain('alter table public.operator_activation_events enable row level security;');
    expect(sql).toContain('create policy "Operators can insert own activation events"');
    expect(sql).toContain('create policy "Operators can view own activation events"');
    expect(sql).toContain('idx_operator_activation_events_event_name_occurred_at');
    expect(sql).toContain('idx_operator_activation_events_session_occurred_at');
  });

  it('ships secure tracking rpc and grants', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create or replace function public.track_operator_activation_event(');
    expect(sql).toContain("raise exception 'Authentication required'");
    expect(sql).toContain("raise exception 'Facility is not owned by the current operator'");
    expect(sql).toContain('grant execute on function public.track_operator_activation_event(');
    expect(sql).toContain('grant select, insert on table public.operator_activation_events to authenticated;');
  });
});

