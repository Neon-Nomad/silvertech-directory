# Facility UUID map: maintenance workflow

Written for: the engineer who updates the facility data or the map. The map links each canonical facility page (for example `assisted-living/minnesota/minneapolis/hope-wellness-center-inc-1127636603`) to its Supabase facility UUID, which Save to Dashboard and Q&A need. Pages whose facility has no reviewed UUID show an explicit unavailable state.

## The invariants

1. **The Netlify build never regenerates the map.** It reads the committed `data/facility-uuid-map.tsv` and checks its integrity. Only the regeneration workflow below writes that file.
2. **An existing mapped assignment never changes without a reviewed record.** Any identity whose mapping changes, is removed, or is newly mapped needs a line in a review file committed with the map.
3. **An unresolved facility never gets a UUID without a unique, evidenced match.** The matcher never picks among duplicates. Duplicate groups and cross-identity conflicts stay unresolved until someone decides with evidence.
4. **A new facility cannot break the build.** A facility that has no map row renders the unavailable state, and the build logs how many there are. The regeneration workflow is what covers it.

## What the change rules are

| Change to an identity | Needs a review line |
|---|---|
| Unchanged | no |
| Mapped to a different UUID | yes |
| Mapped, then unresolved | yes |
| Unresolved, then mapped | yes |
| Unresolved reason changed (for example, duplicate to conflict) | yes |
| New identity, mapped | yes |
| New identity, unresolved | no |
| Identity removed from the data | yes |

Guards that stop a run before anything is installed:

- No static identities or no database rows loaded (a missing or empty export).
- Fewer than 90% of the committed identities loaded (a broken export).
- More than 200 identity changes in one update (split the update).
- Any review entry that matches no identity change, or that has no reviewer.
- Any candidate row that fails the matching rules (the same validation as the build gate).

## Review file format

One line per approved identity change, saved under `docs/uuid-map-reviews/` and committed with the map:

```
<canonical path><TAB><reviewer><TAB><reason, with the evidence>
```

Lines starting with `#` are comments. Use the canonical path exactly as the candidate report prints it. The reason should name the evidence: the database row ID, what changed in the source, and why the decision is unique.

## The workflow

Run from the repository root on the PR branch, with a clean `data/` directory.

1. **Refresh the static identity export.** This is the same export the Netlify build runs:

   ```
   SUPABASE_SERVICE_ROLE_KEY= npm run export-facilities
   ```

   The empty service-role variable makes the export read with the public anon key only, so the local regeneration never uses the service role. Confirm the export finished (`Exported N facilities`).

2. **Build the candidate.** This writes only under `.cache/facility-uuid-map/` (gitignored):

   ```
   npx tsx scripts/build_facility_uuid_map.ts
   ```

   It prints the candidate counts, every identity change that needs review, and the path of the candidate. It exits with status 1 when a change needs review, and writes nothing under `data/`.

3. **Review each change.** For each identity listed, check the source row and the database row, and record the decision in a review file. A change you cannot justify means the input is wrong: fix the input and rerun step 1. Do not add a review line to make a bad change pass.

4. **Promote the reviewed candidate.** This runs the same validation against the committed map and the review file, and installs the map and its metadata only if every identity change is reviewed:

   ```
   npx tsx scripts/build_facility_uuid_map.ts --reviewed docs/uuid-map-reviews/<file>.tsv --promote
   ```

5. **Validate the installed map.** Run each of these, and all must pass:

   ```
   npx tsx scripts/validate_facility_uuid_map.ts
   npx tsx scripts/validate_facility_uuid_map.ts --require-complete
   npx tsx scripts/validate_facility_uuid_map.ts --verify-live
   npx vitest --run tests/facilityUuidMap.test.ts tests/facilityUuidLoader.test.ts tests/facilityUuidRender.test.tsx
   ```

6. **Commit the map together with its metadata and the review file.** Commit `data/facility-uuid-map.tsv`, `data/facility-uuid-map.meta.json`, and `docs/uuid-map-reviews/<file>.tsv` in one commit. Do not commit `.cache/`.

7. **Confirm on a Deploy Preview.** Push the branch, wait for the Netlify check runs to complete, and run the facility UUID browser test against the preview:

   ```
   BASE_URL=<preview URL> npx playwright test --config=playwright.preview.config.ts e2e/facility-uuid-mapping.spec.ts
   ```

## Line endings (Windows)

The map is hashed and parsed byte-for-byte. `.gitattributes` marks it `-text`, so Git never converts its line endings. Without that rule, Git for Windows (`core.autocrlf=true`) writes CRLF, the header check fails, and the validator correctly refuses the file. If `git status` shows the map as modified right after a fresh checkout, restore the committed bytes with:

```
git show HEAD:data/facility-uuid-map.tsv > data/facility-uuid-map.tsv
```

Clone with long-path support on Windows, because a tracked directory has filenames longer than 260 characters: `git -c core.longpaths=true clone ...`.

## When a candidate is rejected

| Message | Usual cause | Action |
|---|---|---|
| `no static facility identities loaded` | export did not run, or the CSV is missing | run step 1 |
| `identities fell from N to M` | export truncated or the facility view is restricted | fix the export; do not lower the guard |
| `N identity changes need review in one update` | a large data change, a bulk removal, or a bad export | split the update into smaller reviewed batches |
| `identity changed ... without review` | the candidate changed a mapping | review it, or fix the input |
| `review entry matches no identity change` | a stale or misspelled review line | remove or correct the line |
| `map header does not match` | CRLF line endings | restore the committed bytes (see above) |
| `map file does not match its provenance hash` | the map was edited by hand | regenerate instead |

## What the Netlify build checks

`build:hybrid` runs the validator in build mode: map integrity (hash, format, no duplicate UUIDs, no UUID on an unresolved row, decisions approved), and every mapped UUID's name, city and state against the static identity. Facilities without a row are reported as a note, not a failure. Any integrity problem fails the build.

## Rollback

A map change is data, and it ships with the code. To undo one, revert the commit that changed `data/facility-uuid-map.tsv` and its metadata, and redeploy. The previous map restores exactly, byte for byte, and the review file records why the change was made.

## Known limits

- The static identity set comes from `all_senior_living_complete.csv`, which is generated at build time and is not committed. From the next promotion on, the metadata records a hash of the canonical path list (`canonicalPathsSha256`), so a changed identity set is visible in review. The committed metadata predates that field until the first promotion.
- The matcher is conservative. Duplicate and conflicting listings (5,993 of 78,239 identities at the current data) stay unresolved until someone decides with evidence, which is by design.
