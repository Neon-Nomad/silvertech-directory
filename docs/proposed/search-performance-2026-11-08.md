# Directory search timeouts: cause and fix (2026-11-08)

Written for: the production owner. Status: migration prepared and tested on a local copy. **Not applied to production.** The production database could not be reached from this session, because the Supabase CLI login was rejected.

## What visitors see

- Occasionally a search takes about 3 seconds, then falls back to offline listings with the message "Live search is unavailable".
- One production call was observed as HTTP 500 after 3.36 seconds. A 500 at about 3 seconds matches Supabase's limit of 3 seconds on statements run by anonymous visitors. The 500 response body was not captured, so this is the most likely explanation, not a confirmed one.

## Root cause

`search_facilities` (the directory search function) does this for every search:

1. Finds every facility that matches the filters.
2. Normalises five text fields for each match, to find duplicate listings.
3. Sorts every match with a window function, to keep one row per duplicate group.
4. Sorts the survivors by name, then returns 50.

Steps 2 to 4 do work in proportion to the number of matches, not to the 50 rows returned. A search for one letter, or a nationwide city, matches most of the 91,121 facilities. Locally that sort spilled about 14 MB to disk, because `work_mem` is 4 MB.

The app also used to run an unfiltered nationwide search as its "no results" fallback. That search has the same cost, and it has been removed from the front end (PR #12).

## Measurements

Local copy: Supabase Postgres 17.6, the 91,121 rows from `all_senior_living_complete.csv`, the same indexes as the migrations, and the anonymous role's 3-second statement limit. Times are `EXPLAIN ANALYZE` execution times. Production hardware differs, so compare the ratios rather than the absolute numbers.

| Search | Before | After |
|---|---|---|
| One letter "a", nationwide | 249 ms | 112 ms |
| "ca", nationwide | 102 ms | 96 ms |
| "care", nationwide | 88 ms | 58 ms |
| Nationwide, no filters | 241 ms | 35 ms |
| State CA | 43 ms | 19 ms |
| State MN | 15 ms | 9 ms |
| City "%minneapolis%", nationwide | 23 ms | 10 ms |
| ZIP 55401 | 13 ms | 3 ms |
| Name "Guardian" | 29 ms | 7 ms |
| City "%abc%", no matches | 23 ms | 4 ms |

## The fix

`docs/proposed/search-performance-migration-2026-11-08.sql`

- Looks at the first few matching rows in name order, and checks each for a better duplicate with an index lookup. If too few rows survive, it widens the window and repeats. The work now scales with the page size.
- Adds an expression index on the duplicate key, so the check does not scan the table.
- Keeps the same signature and columns, so the front end does not change.
- Keeps the same duplicate rule: a group is the same normalised name, address, city, state, and postal code, and the kept row is the lowest `public_route_id` (nulls last), then the lowest `id`.

## Verification

- `docs/proposed/search-performance-verify-2026-11-08.sql`: 360 random real filter combinations, comparing the old and new functions. 0 mismatches for full result sets, and 0 for the first 50 names.
- Duplicate-heavy checks: 30 searches for the most duplicated facility names, with page one and page two. 0 mismatches.
- The migration was applied twice locally without error, so it can be re-run.

## Deployment

1. Take a backup or confirm point-in-time recovery is available.
2. Run the verification script against a copy first, with `search_facilities_before` created as described in its header.
3. In the Supabase SQL editor, run the migration file. It runs in one transaction. It locks `facilities` briefly while the index is built (about a second at this size). Do it at a quiet time.
4. Run a few searches on the live site, and time them from the browser network panel.
5. Do not run `supabase db push` for this change. It would also apply the pending March migration (`20260321133000`), which is not approved.

## Not done here

- The root cause is inferred from the function and from the local copy. The production query plan has not been read, because it needs database access.
- The 500 response body was not captured, so the 3-second limit is the most likely explanation rather than a confirmed one.
- The one-letter name search is still the slowest case. Requiring at least three letters for name search would remove it, but that is a product decision, so it is not included.
