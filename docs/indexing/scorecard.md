# SilverTech indexing scorecard

Maintained by the `silvertech-indexing` agent. Every entry is a dated observation. Technical checks and Google's own results are kept separate, because Google recrawls on its own schedule.

## Current state

| Area | Status | Measured | Source |
|---|---|---|---|
| Production deploy | PR #40 merged 2026-11-10 23:51 UTC (`b64c927`). Deploy confirmation pending at time of writing. | Poll for the shell canonical to disappear from `https://silvertechdirectory.com/` | GitHub PR #40, live HTML |
| Unknown paths | Still HTTP 200 with the SPA shell. Not-found page now sets `noindex` in the client bundle. | Live check 2026-11-10 (before deploy) | `curl`, `public/_redirects:155515` |
| `/pricing` canonical | Homepage canonical in initial HTML before deploy. Route sets its own canonical via Helmet. | Live check 2026-11-10 (before deploy) | `curl`, `PricingPage.tsx:68` |
| Shared navigation | `/resources/` link fixed in the branch. `/privacy` and `/terms` still have no routes (known open item). | Source and build check 2026-11-10 | `Base.astro`, `indexingContract.test.ts` |
| Sitemaps | `sitemap-index.xml` last downloaded by Search Console 2026-11-01. Status Valid, 0 errors, 0 warnings. | Search Console API | `get_sitemaps` |
| Sitemap submitted count | 102,801 URLs. The API labels this `indexed_urls`, but it is the submitted count, not indexed coverage. | Search Console API | `get_sitemaps` |
| URL Inspection, 8 sample URLs | All 8 returned "URL is unknown to Google", last crawled "Never". Includes two facility pages, a city page, a care-state page, a state page, `/pricing`, a Maine city page, and an independent-living cost page. | Search Console API | `batch_url_inspection` |
| Search performance, last 28 days | 0 clicks, 38 impressions, average position 1.5 (mostly from site-operator queries) | Search Console API | `get_performance_overview` |
| Search performance, last 90 days | 0 clicks, 146 impressions, average position 19.5 | Search Console API | `get_performance_overview` |
| 404 validation | Started 2026-11-07 for 6,785 pages (per `docs/gsc-baseline-2026-11-08.md`). Current status is not exposed by the API and needs checking in the Search Console UI. | Baseline document | Not verified |

## Interpretation

- Google has not discovered or crawled the sampled facility, city, and state pages. That is a larger barrier than the defects listed above, and no technical change in this branch addresses it directly.
- The fixes so far remove real defects that could affect how Google handles unknown and duplicate URLs. They are not expected to move indexed counts on their own.
- Any validation started before a deployment does not measure the fix.

## Next actions

1. Confirm the production deploy (shell canonical gone, `/pricing` canonical correct in raw HTML).
2. Export the Search Console Pages report (UI) with its date. The API does not expose indexed and excluded totals.
3. Decide, with explicit approval, whether to change the unknown-path behaviour in `public/_redirects`.
4. Decide what to do about `/privacy`, `/terms`, and `/register` (legal pages and an account page are needed first).
5. Re-run the URL Inspection sample after Google has had time to recrawl, and record the last-crawled dates.
