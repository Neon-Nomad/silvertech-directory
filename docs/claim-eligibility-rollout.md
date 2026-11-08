# Claim eligibility rollout

Written for: the production owner and the engineer who deploys this. Status: not applied to production. Each production step needs explicit approval.

## What this change does
- Claims are allowed only for a facility that is a reviewed, unique identity in the committed UUID map and has no owner yet. The database enforces this (`facility_claims` insert policy), not only the page.
- Duplicate, conflicting, and unmatched facilities show a support path instead of a claim button.
- Save and tour interest use the mapped database UUID, and are recorded only for reviewed identities.
- The developer `/__integrity` route is no longer enabled by a visitor's URL (separate PR #7).

## Deployment order (do not reorder)
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

## Known limits (not fixed here)
- The database cannot yet tell operators from family accounts. Sign-up stores the role in `user_metadata`, which the user controls. A family account can therefore file a pending claim through the API. Staff review or the existing auto-approval rules still decide ownership. Fixing this means assigning the role on the server (`app_metadata`) and changes sign-up, so it needs its own approval.
- Live lead events: no live surface writes `lead_events`. The only writers were `LeadModal` (removed, no importers) and `FacilityQA` (no importers, still present). No new tracking was added.
