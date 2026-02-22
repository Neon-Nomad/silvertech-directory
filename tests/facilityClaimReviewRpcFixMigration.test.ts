import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260222135500_fix_claim_review_rpc_created_at_type.sql',
);

describe('facility claim review rpc type fix migration', () => {
  it('casts claim created_at into timestamptz in review RPC', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create or replace function public.get_pending_facility_claims_for_review()');
    expect(sql).toContain("(fc.created_at at time zone 'utc') as created_at");
    expect(sql).toContain('returns table (');
    expect(sql).toContain('created_at timestamptz');
  });
});
