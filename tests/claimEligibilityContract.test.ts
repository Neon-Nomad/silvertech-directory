import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from '../scripts/lib/facilityUuidMap';

const read = (rel: string) => fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
const migrationFile = fs
  .readdirSync(path.resolve(process.cwd(), 'supabase/migrations'))
  .find((f) => f.endsWith('_claim_eligibility_and_ownership_guard.sql'));
const migration = migrationFile ? read(`supabase/migrations/${migrationFile}`) : '';

describe('claim eligibility migration', () => {
  it('exists and creates the eligibility table with row-level security enabled', () => {
    expect(migrationFile).toBeDefined();
    expect(migration).toMatch(/create table if not exists public\.facility_claim_eligibility/i);
    expect(migration).toMatch(/alter table public\.facility_claim_eligibility enable row level security/i);
  });

  it('keeps the eligibility table away from anon and authenticated clients', () => {
    expect(migration).toMatch(/revoke all on public\.facility_claim_eligibility from public, anon, authenticated/i);
  });

  it('exposes only answers, through security-definer functions with a fixed search path', () => {
    expect(migration).toMatch(/function public\.reviewed_facility_ids\(p_facility_ids uuid\[\]\)[\s\S]*security definer/i);
    expect(migration).toMatch(/function public\.is_claimable_facility\(p_facility_id uuid\)[\s\S]*security definer/i);
    expect(migration.match(/set search_path = public/gi)?.length).toBeGreaterThanOrEqual(2);
  });

  it('replaces the claim insert policy so it requires a claimable, unowned facility', () => {
    expect(migration).toMatch(/drop policy if exists "Users can create pending claims" on public\.facility_claims/i);
    expect(migration).toMatch(/create policy "Users can create pending claims on claimable facilities"/i);
    expect(migration).toMatch(/auth\.uid\(\) = user_id[\s\S]*status = 'pending'[\s\S]*public\.is_claimable_facility\(facility_id\)/i);
  });

  it('does not ship any facility data inside the migration itself', () => {
    expect(migration).not.toMatch(/insert into public\.facility_claim_eligibility/i);
  });
});

describe('claim eligibility seed', () => {
  const seed = read('supabase/seed-data/facility_claim_eligibility.sql');
  const mappedUuids = new Set(
    parse(read('data/facility-uuid-map.tsv'))
      .flatMap((row) => (row.status === 'mapped' ? [row.uuid] : [])),
  );

  it('contains exactly the mapped, unique identities from the committed map', () => {
    const seeded = [...seed.matchAll(/\('([0-9a-f-]{36})'\)/g)].map((m) => m[1]);
    expect(new Set(seeded).size).toBe(seeded.length);
    expect(new Set(seeded)).toEqual(mappedUuids);
  });

  it('never seeds an unresolved, duplicate, or conflicting identity', () => {
    const unresolved = parse(read('data/facility-uuid-map.tsv')).flatMap((row) =>
      row.status === 'unresolved' ? row.candidates : [],
    );
    const seededSet = new Set([...seed.matchAll(/\('([0-9a-f-]{36})'\)/g)].map((m) => m[1]));
    expect(unresolved.filter((uuid) => seededSet.has(uuid))).toEqual([]);
  });

  it('joins to facilities, so an identity missing from the database is skipped, not inserted', () => {
    expect(seed).toMatch(/join public\.facilities f on f\.id = v\.id::uuid/i);
    expect(seed).toMatch(/on conflict \(facility_id\) do nothing/i);
  });
});

describe('send-tour-guide records interest only for reviewed listings', () => {
  const fn = read('netlify/functions/send-tour-guide.ts');

  it('checks the reviewed-identity RPC before inserting interest', () => {
    const rpcAt = fn.indexOf('/rest/v1/rpc/reviewed_facility_ids');
    const insertAt = fn.indexOf('/rest/v1/facility_tour_interest');
    expect(rpcAt).toBeGreaterThan(0);
    expect(insertAt).toBeGreaterThan(rpcAt);
  });

  it('keys the interest row by the database UUID, not the public slug', () => {
    expect(fn).toMatch(/facility_id: facilityUuid/);
    expect(fn).not.toMatch(/facility_id: facilityId/);
  });
});
