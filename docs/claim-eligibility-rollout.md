# Claim eligibility rollout

Written for: the production owner and the engineer who deploys this. Status: not applied to production. Each production step needs explicit approval.

## What this change does
- Claims are allowed only for a facility that is a reviewed, unique identity in the committed UUID map and has no owner yet. The database enforces this (`facility_claims` insert policy), not only the page.
- Duplicate, conflicting, and unmatched facilities show a support path instead of a claim button.
- Save and tour interest use the mapped database UUID, and are recorded only for reviewed identities.
- The developer `/__integrity` route is no longer enabled by a visitor's URL (separate PR #7).

## Deployment order (do not reorder)
0. **Read-only pre-check.** Run this in the production SQL editor. Expect exactly the two policies shown, or none. If any other INSERT or ALL policy exists on `facility_claims`, stop: the migration will refuse to run, and the policy must be reviewed first.
```sql
select policyname, cmd, roles, qual, with_check from pg_policies where schemaname = 'public' and tablename = 'facility_claims' order by cmd, policyname;
select count(*) from public.facility_claim_eligibility;  -- expect an error (table absent) before step 1
```
1. **Apply the migration** `supabase/migrations/20261108150000_claim_eligibility_and_ownership_guard.sql` to production. Creates `facility_claim_eligibility`, two security-definer functions, and the new insert policy.
2. **Load the seed** `supabase/seed-data/facility_claim_eligibility.sql` (72,246 reviewed identities). It joins to `facilities`, so an ID missing from the database is skipped, not inserted.
3. **Verify** the counts below.
4. **Deploy the frontend** (merge PR #3 after review, then the Netlify build runs).

Until steps 1 and 2 are done, the new code fails closed: no facility is claimable, no facility can be saved from search, and the claim page says it cannot check the listing. Do not deploy the frontend first.

## Read-only checks (SQL editor)
```sql
-- 1. Migration recorded (expect one row for the new version after step 1)
select version, name from supabase_migrations.schema_migrations where version = '20261108150000';

-- 2. Seed loaded (expect 72246, or fewer only if some reviewed facilities are absent from the database; investigate any gap)
select count(*) from public.facility_claim_eligibility;

-- 3. Every eligible facility exists and is currently unowned or owned (both are expected; claims are blocked when owned)
select count(*) filter (where f.owner_id is null) as unowned, count(*) filter (where f.owner_id is not null) as owned
from public.facility_claim_eligibility e join public.facilities f on f.id = e.facility_id;

-- 4. Anonymous clients cannot read the table (expect zero rows through the API; run as anon in the API tester if needed)
```

## Rollback
- Frontend: redeploy the previous Netlify build.
- Database policy, if it must be reverted:
```sql
drop policy if exists "Users can create pending claims on claimable facilities" on public.facility_claims;
create policy "Users can create pending claims"
  on public.facility_claims for insert
  with check (auth.uid() = user_id and status = 'pending');
```
- The eligibility table and functions can stay; nothing reads them once the policy is reverted.

## Detection after deploy
- **Expected counts:** `facility_claim_eligibility` = 72,246. A lower number means some reviewed IDs are not in `facilities`. Investigate before the frontend deploy.
- **Refused inserts:** Supabase API logs for `facility_claims` with code `42501`. A few are expected (owned or duplicate listings, reached by URL). A rise for signed-in operators on listings shown as claimable means the eligibility table or the frontend is out of step. Roll back the frontend first.
- **Claim volume:** daily `facility_claims` rows, compared with the week before. A drop to zero for a day after deploy is a rollback trigger.
- **Search:** the `reviewed_facility_ids` RPC returning errors in the logs means claims and saves are withheld for everyone. Check the RPC exists and the eligibility table is loaded.
- **Tour interest:** Netlify function logs for `Tour interest skipped` or `Tour interest not recorded`. Some are expected for unresolved listings.

## Rollback order
1. Redeploy the previous Netlify build. Claim and save behave as before.
2. If claims must stop at the database, clear the eligibility table: `delete from public.facility_claim_eligibility;`. This blocks new claims without changing any existing claim or ownership record.
3. Revert the insert policy only if step 2 is not enough (SQL below).

## Migration behaviour on re-run (tested locally)
- Running the migration and seed three times gives the same state each time: 2 eligibility rows in the test database, one policy on `facility_claims`, no errors.
- The migration refuses to run if `facility_claims` has any other INSERT policy. Testing confirmed nothing changed in that case.
- A leftover permissive insert policy would let a duplicate claim through (tested: HTTP 201), so the refusal is the protection, not a convenience.

## Known limits (not fixed here)
- `facilities.canonical_payload` is missing in production and in the repository's migrations. The directory enrichment query selects it, so it fails and is caught. Search still returns results, without trust fields. This release does not depend on that column.
- The database cannot yet tell operators from family accounts. Sign-up stores the role in `user_metadata`, which the user controls. A family account can therefore file a pending claim through the API. Staff review or the existing auto-approval rules still decide ownership. Fixing this means assigning the role on the server (`app_metadata`) and changes sign-up, so it needs its own approval.
- Live lead events: no live surface writes `lead_events`. The only writers were `LeadModal` (removed, no importers) and `FacilityQA` (no importers, still present). No new tracking was added.
