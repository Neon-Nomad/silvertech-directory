# NY pilot batch 001: production data changes and rollback

Approved 2026-11-11. Scope: the 23 records in `data/category-batches/batch-001-pilot.tsv` only.

## 1. Claim eligibility (Supabase, `public.facility_claim_eligibility`)

Removes the 19 facility UUIDs that the pilot retires or consolidates (the other 4 removed pages are the
2 unresolved identities, which were never eligible, and the 2 reclassified Peregrine identities, which stay eligible).

| Step | File | Check |
|---|---|---|
| Before | `claim-eligibility-before.json` | 72,246 rows; md5 of all IDs `e45a0a56505a1700e1767c7d55309286`; the 19 rows captured exactly |
| Forward | `claim-eligibility-forward.sql` | Atomic: removes exactly 19 rows or raises and removes nothing |
| Verify | `claim-eligibility-expected-after.json` | 72,227 rows; md5 of all IDs `eb1c6981f8fcc61afaf76903de18b073` (computed before the change from the rows that must remain); none of the 19 present |
| Rollback | `claim-eligibility-rollback.sql` | Re-inserts the 19 rows with their original `source` and `added_at`; afterwards 72,246 rows and the original md5 |

Pre-checks done on 2026-11-11: none of the 19 facilities has an owner or `claimed_at`, and `facility_claims` has no row
for any of them.

## 2. Search

- Site search (`DirectorySearch`) queries the database function `search_facilities`; Typesense is only a fallback
  used when that call fails. Claim search uses `is_claimable_facility`, which reads the eligibility table above.
- Typesense documents are keyed by the database facility ID and hold no URL or care type.
- Typesense forward: delete the documents whose IDs are the retired/consolidated database rows; record each deleted
  document's full JSON first. Rollback: re-import the recorded documents with `action: upsert`.
- Needs production Typesense credentials from the Netlify production environment; they are read inside the script
  and never printed or written to disk.

## 3. Site deployment

Merge PR #45 only after sections 1 and 2 are verified. Rollback: revert the merge commit on `main`; Netlify redeploys
the previous state (redirects, registry, map and pages are all in the commit).
