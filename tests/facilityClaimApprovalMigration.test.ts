import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260222120000_sync_claim_approval_to_facility_ownership.sql',
);

describe('facility claim approval ownership sync migration', () => {
  it('creates unique approved-claim guard per facility', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create unique index if not exists idx_facility_claims_one_approved_per_facility');
    expect(sql).toContain("where status = 'approved'");
  });

  it('syncs approved claims into facility ownership fields', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create or replace function public.sync_facility_ownership_from_claim()');
    expect(sql).toContain("if tg_op = 'INSERT' then");
    expect(sql).toContain("elsif tg_op = 'UPDATE' then");
    expect(sql).toContain("v_should_sync := new.status = 'approved'");
    expect(sql).toContain('set');
    expect(sql).toContain('owner_id = new.user_id');
  });

  it('rejects stale pending claims and wires the trigger', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain("status = 'rejected'");
    expect(sql).toContain("and status = 'pending'");
    expect(sql).toContain('create trigger trg_sync_facility_ownership_from_claim');
    expect(sql).toContain('before insert or update on public.facility_claims');
  });
});
