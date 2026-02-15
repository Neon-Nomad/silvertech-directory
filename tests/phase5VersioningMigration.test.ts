import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260215153000_add_facility_profile_versions_phase5.sql'
);

describe('Phase 5 profile versioning migration contract', () => {
  it('defines facility_profile_versions table with required statuses', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain('create table if not exists public.facility_profile_versions');
    expect(sql).toContain("status in ('draft', 'published', 'archived')");
  });

  it('includes operator RPC functions for state, draft save, and publish', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain('create or replace function public.get_operator_facility_profile_state');
    expect(sql).toContain('create or replace function public.save_operator_facility_profile_draft');
    expect(sql).toContain('create or replace function public.publish_operator_facility_profile');
  });

  it('grants execute permissions to authenticated role', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain('grant execute on function public.get_operator_facility_profile_state(uuid) to authenticated;');
    expect(sql).toContain('grant execute on function public.save_operator_facility_profile_draft(uuid, jsonb) to authenticated;');
    expect(sql).toContain('grant execute on function public.publish_operator_facility_profile(uuid) to authenticated;');
  });
});

