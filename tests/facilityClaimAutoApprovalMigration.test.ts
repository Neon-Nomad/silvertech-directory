import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260222133000_auto_approve_claims_with_trust_signals.sql',
);

describe('facility claim auto-approval migration contract', () => {
  it('creates trusted auto-approval trigger function', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create or replace function public.auto_approve_facility_claim_if_trusted()');
    expect(sql).toContain("if new.status <> 'pending' then");
    expect(sql).toContain('from auth.users u');
    expect(sql).toContain('u.email_confirmed_at is not null');
  });

  it('requires matching trust signals before auto-approval', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('v_claim_business_email is distinct from v_auth_email');
    expect(sql).toContain('v_has_domain_signal');
    expect(sql).toContain('v_has_phone_signal');
    expect(sql).toContain("status = 'approved'");
  });

  it('registers after-insert trigger on facility_claims', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create trigger trg_auto_approve_facility_claim');
    expect(sql).toContain('after insert on public.facility_claims');
    expect(sql).toContain('execute function public.auto_approve_facility_claim_if_trusted();');
  });
});
