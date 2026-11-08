# PR #3 production go/no-go and rollback checklist

Scope: PR #3 (`facility-uuid-map`) is the combined release of the CSP repair and the facility UUID map. PR #2 is not merged separately. The release touches no database migrations, no Supabase functions, and no DNS. It changes the static site and the build-time map only.

Rollback target: Netlify production deploy `6aef69d167b69870039c2e17` (branch `main`, commit `d69a6de6`, published 2026-11-07T18:18:21Z). Record the production deploy ID again immediately before merging, in case production has moved.

## A. Go/no-go gates (all must be true)

| # | Gate | Evidence required | Status |
|---|---|---|---|
| 1 | Owner SQL results R1, L1, L2 reviewed; no unresolved exposure | Owner's written results and the decision | open |
| 2 | Final PR head has a completed Netlify Deploy Preview | Deploy record with the head commit, state `ready` | verify on the final head |
| 3 | Playwright, pinned to that deploy, all pass | Count of passing tests (18 at the last run) | verify on the final head |
| 4 | SEO regression vs production passes | 373 pages and 150 legacy redirects, zero failures | verify on the final head |
| 5 | CSP header on that deploy has the expected script hashes, no `unsafe-inline` in `script-src` | Header check | verify on the final head |
| 6 | Client-bundle secret scan is clean | Pattern counts over every script the pages load | verify on the final head |
| 7 | Map validation passes (build mode, `--require-complete`, `--verify-live`) | Validator output | verify on the final head |
| 8 | Unit suite: no new failures | 202 pass, 6 fail on the Windows checkout. Five of the six also fail on an LF archive of `main`; the sixth is a CRLF artifact that passes on LF | confirmed |
| 9 | Unresolved facilities still unresolved | 5,993 unresolved, zero UUIDs assigned | verify on the final head |
| 10 | Explicit approval from the owner to merge | Written approval naming PR #3 | not given |

## B. Deploy steps (after gate 10 is approved)

1. Record the current production deploy ID (expected `6aef69d167b69870039c2e17`).
2. Merge PR #3 into `main`. Do not push directly to `main`.
3. Wait for the production deploy from `main` to reach `ready`. Record its deploy ID and commit.
4. Confirm the production deploy's commit is the PR #3 merge commit.

## C. Post-deploy checks (production)

Run each against `https://silvertechdirectory.com`. Stop and roll back on any failure in C1–C4.

- C1. Playwright against production: `BASE_URL=https://silvertechdirectory.com npx playwright test --config=playwright.preview.config.ts`. All pass.
- C2. Mapped facility: `/assisted-living/minnesota/minneapolis/hope-wellness-center-inc-1127636603/` shows Save to Dashboard, and its Q&A calls use the mapped UUID.
- C3. Unresolved facility: `/nursing-homes/alabama/altoona/altoona-health-rehab-41/` shows the unavailable messages and makes no facility-scoped request.
- C4. CSP: the production header carries the same script hashes as the preview, and `script-src` has no `unsafe-inline`. GTM loads with no CSP violations.
- C5. Redirects: the 150 sampled legacy URLs return their expected targets, and none returns a 5xx.
- C6. Sitemaps: each child sitemap's URL set matches the pre-release baseline (102,801 URLs, 78,239 facility URLs).
- C7. Canonical pages: the sampled facility, city and regulation pages return 200 with self-referencing canonicals.
- C8. Supabase: a 24-hour window of anon REST activity on `facilities` with no spike, and no new error rates on `approved_facility_qa` or `get_public_facility_enriched`.
- C9. Search Console: no new coverage errors on the next crawl cycle. This is a monitoring item, not a same-day gate.

## D. Rollback

Triggers: any C1–C4 failure, a 5xx rate on facility pages, mapped Save or Q&A failing for a sample of mapped facilities, or a broken redirect group.

Method, in order of preference:

1. Netlify: publish the rollback target deploy (`6aef69d167b69870039c2e17`) from the production deploy list. This restores the previous site with no code change. It takes effect in minutes.
2. Git: revert the PR #3 merge commit on `main` and let Netlify deploy the revert. Use this only if the Netlify publish is not possible.

After any rollback, rerun C1–C5 against production.

What rollback does not touch: the database (no migrations in this release), DNS, Supabase permissions, and the review records. A rollback leaves the map as it was before the release, because the map is part of the site build.

## E. Explicit exclusions

- No merge of PR #2 separately.
- No production data, permission, or DNS change is part of this release.
- No UUID is selected for an unresolved facility in this release. Changing any of the 5,993 requires the review workflow in `docs/uuid-map-maintenance.md`.
