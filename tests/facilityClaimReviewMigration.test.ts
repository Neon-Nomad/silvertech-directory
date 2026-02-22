import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260222124500_secure_claim_submission_and_add_review_rpcs.sql',
);

describe('facility claim review migration contract', () => {
  it('locks claim inserts to pending status', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('drop policy if exists "Users can create claims"');
    expect(sql).toContain('create policy "Users can create pending claims"');
    expect(sql).toContain("with check (auth.uid() = user_id and status = 'pending')");
  });

  it('creates reviewer allowlist and reviewer-check helper', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create table if not exists public.claim_reviewers');
    expect(sql).toContain('create or replace function public.is_claim_reviewer');
    expect(sql).toContain("raise exception 'Not authorized to review claims'");
  });

  it('ships pending-claim list and approve/reject RPCs', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create or replace function public.get_pending_facility_claims_for_review()');
    expect(sql).toContain('create or replace function public.review_facility_claim(');
    expect(sql).toContain("v_decision not in ('approved', 'rejected')");
    expect(sql).toContain('grant execute on function public.get_pending_facility_claims_for_review() to authenticated;');
    expect(sql).toContain('grant execute on function public.review_facility_claim(uuid, text) to authenticated;');
  });
});
