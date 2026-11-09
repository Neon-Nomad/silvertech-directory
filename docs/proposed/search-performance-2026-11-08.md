# Directory search timeouts: cause, fix, and deployment (2026-11-08)

Written for: the production owner. Status: **reviewed and tested on a local copy. Not applied to production.**

## Deploy with one action

1. Take a point-in-time backup, or confirm Supabase point-in-time recovery is on.
2. In the Supabase SQL Editor, open `docs/proposed/search-performance-DEPLOY-2026-11-08.sql`, paste the whole file, and run it once. It runs in one transaction. If the safety check fails, nothing changes.
3. Run `docs/proposed/search-performance-VERIFY-2026-11-08.sql` (read-only) and paste the result back. Expected: 1 function, `plpgsql`, index valid, anon can run search, anon cannot run the helper.

Do not run `supabase db push` for this change. It would also apply the pending March migration, which is not approved.

**Rollback:** run `docs/proposed/search-performance-ROLLBACK-2026-11-08.sql` in the SQL Editor. It restores the previous function exactly as migration 20260314174000 defines it. The index can stay.

## Root cause

`search_facilities` finds every matching facility, normalises five text fields on each, sorts every match to remove duplicates, then sorts the survivors by name and returns 50. Its cost grows with the number of matches, not with the 50 rows returned. A one-letter search, or a nationwide city, matches most of the 91,121 facilities. Locally the sort spilled about 14 MB to disk.

## Production baseline (before deployment)

Measured through the public search endpoint, five runs each, on 2026-11-08 (`bench-before.json` in the scratch folder):

| Search | Median | Max | Rows |
|---|---|---|---|
| One letter "a" | 1,402 ms | 3,378 ms | 50 |
| "care" | 563 ms | 580 ms | 50 |
| Nationwide, no filters | 1,234 ms | 1,251 ms | 50 |
| State CA | 312 ms | 362 ms | 50 |
| State MN | 136 ms | 155 ms | 50 |
| City Minneapolis, MN | 112 ms | 135 ms | 50 |
| ZIP 55401 | 88 ms | 113 ms | 2 |
| Name "Guardian" in MN | 80 ms | 123 ms | 6 |
| No match "abc" | 173 ms | 280 ms | 0 |

All returned HTTP 200. The one-letter search reached 3.4 seconds in one run, the same range as the reported timeouts.

## Review of the change (PR #14)

- **Security.** The function keeps `security definer` and `set search_path = public`, and every table reference is schema-qualified. There is no dynamic SQL. The helper is `immutable`, which the index needs, and the deployment revokes its execute grant from `public`, `anon`, and `authenticated`. The search function still runs as its owner, so it does not need that grant.
- **Dependencies.** It needs `facilities`, `facility_questions`, and `facility_answers`, which the current function already reads. It replaces the function from migration 20260314174000. The safety check stops the deployment if there is more than one overload.
- **Results.** The duplicate rule is unchanged: same normalised name, address, city, state, and postal code. Within a group, the lowest `public_route_id` (nulls last), then the lowest `id`, is kept. Output order is by name, as before.
- **Paging.** The window widens until enough rows are kept or every match is examined, so it terminates, and page two gives the same rows.
- **Locks.** The index build takes a SHARE lock on `facilities` for about a second at this size, which blocks inserts for that moment. The function swap runs in the same transaction.

## Verification done so far

- **Equivalence, locally.** 360 random filter combinations against the old function: full result sets and first-50 name order match. 30 duplicate-heavy name searches with page two: match.
- **Deploy, rollback, redeploy, locally.** All three run cleanly. Fingerprints after rollback match fingerprints after deployment.
- **Safety check, locally.** With a second overload present, the deployment stops with a clear message and changes nothing.
- **Speed, locally** (Supabase Postgres 17, anonymous 3-second limit). Nationwide with no filters: 241 ms to 35 ms. Nationwide city: 23 ms to 10 ms. ZIP: 13 ms to 3 ms. One letter: 250 ms to 112 ms.

Production has not been checked yet. After deployment, the benchmark and the result fingerprints will be rerun against production.

## Not proven

- The 3-second timeout is the likeliest cause of the 500s. The 500 response body was not captured.
- Local timings are from a copy with the same row count and distributions, on different hardware. Use the production benchmark for the real figures.
