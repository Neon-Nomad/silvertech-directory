# SilverTech indexing scorecard

Maintained by the `silvertech-indexing` agent. Every entry is a dated observation. Technical checks, Google's own results, and content quality are kept separate. Google recrawls on its own schedule, so a fix and its effect on indexing are recorded at different times.

## 1. Technical indexability (verified 2026-11-11 00:00 UTC, after PR #40 deployed)

| Check | Before PR #40 (2026-11-10) | After PR #40 | How measured |
|---|---|---|---|
| Homepage shell canonical on every SPA route | Present (homepage canonical in raw HTML of `/pricing`, `/contact/`, unknown paths) | Removed from raw HTML | `curl` |
| `/pricing` canonical after rendering | Not checked | `https://silvertechdirectory.com/pricing`, title "Pricing \| SilverTech Directory" | Playwright, production |
| Homepage canonical after rendering | n/a | `https://silvertechdirectory.com/` | Playwright, production |
| Unknown path, e.g. `/this-page-does-not-exist-xyz/` | HTTP 200, homepage canonical | HTTP 200 (unchanged), rendered `noindex, nofollow`, no canonical, title "Page not found" | `curl`, Playwright |
| Shared nav "Resources" link | `/resources/` (no route) | `/guides/` | Live HTML of a facility page |
| `/privacy`, `/terms` links | No routes | Still no routes (open item, needs legal pages) | `tests/indexingContract.test.ts` |
| Facility page canonical | Self-canonical | Self-canonical (unchanged) | `curl` |

Regression coverage: `tests/indexingContract.test.ts` (7 tests).

## 2. Google's view (Search Console, read-only)

| Measure | Value | Date | Source |
|---|---|---|---|
| Sitemap index | Last downloaded 2026-11-01, status Valid, 0 errors, 0 warnings | 2026-11-10 | `get_sitemaps` |
| Submitted URLs | 102,801. The API labels this `indexed_urls`; it is a submitted count, not indexed coverage. | 2026-11-10 | `get_sitemaps` |
| Pages report (indexed / excluded totals) | Not available through the API. Last known: 124 indexed, 45,760 crawled not indexed, 58,567 discovered not indexed (screenshot dated 2026-10-22). | 2026-10-22 | Search Console UI, user-supplied |
| Search performance, 90 days | 0 clicks, 146 impressions | 2026-11-10 | `get_performance_overview` |
| 404 validation | Started 2026-11-07, before PR #40. It does not measure PR #40. Current status needs the UI. | 2026-11-07 | Baseline document |

URL Inspection spot checks (2026-11-10, 18 URLs, not a sitewide estimate):

| Result | URLs |
|---|---|
| Crawled, currently not indexed | Arizona assisted-living facility (crawled 2026-07-11), Ohio nursing home (2026-06-08), `/assisted-living/` (2026-06-08), `/regulations/washington/` (2026-04-27) |
| URL is unknown to Google (never crawled) | 14 URLs, including facility pages in memory care, independent living, residential care, adult day, and CCRC; city and state hubs; `/pricing`; and the 1,080-word guide `/guides/hidden-costs-of-memory-care/` |

## 3. Programmatic content quality (measured 2026-11-10 on the `build:hybrid` output of main at `7c7b761` plus PR #40)

Page inventory in the build: 78,239 facility pages, 24,050 city pages, 258 care-state pages.

Method: `scripts/seo/content_similarity.mjs`. Main content only, with the page's own name, address, city, state, and numbers replaced by placeholders. "Page-specific words" is the share of remaining words that do not appear in at least half the sampled pages of the same family. "Pair Jaccard" is 5-word-shingle overlap between random pairs in the same family (1.0 means identical).

| Family | Sampled | Main words (median) | Page-specific words (median) | Pair Jaccard (median) | Pages with an exact duplicate template |
|---|---|---|---|---|---|
| Facility: assisted living | 200 | 272 | 10.8% | 0.45 | 8 |
| Facility: memory care | 200 | 245 | 8.4% | 0.55 | 4 |
| Facility: nursing homes | 200 | 293 | 7.9% | 0.44 | 24 |
| Facility: independent living | 200 | 233 | 5.6% | 0.51 | 2 |
| Facility: residential care | 200 | 269 | 9.4% | 0.28 | 2 |
| Facility: adult day services | 200 | 287 | 8.1% | 0.68 | 105 |
| Facility: CCRC | 200 | 247 | 7.7% | 0.42 | 0 |
| City pages (7 families, 100 each) | 700 | about 1,000 | 2.3% to 8.0% | 0.39 to 0.80 | 0 |
| Care-state pages | 258 | 982 | 7.4% | 0.35 | 0 |

Facility page field coverage (1,400 sampled): state licence shown 60%, CMS number 19%, official website 9%, phone 83%, nearby listings 72%, bed count 0%, last-verified date 0%, data source 0%.

Unsupported or wrong text found on sampled facility pages:

- "Regulatory Standing: Active" on 100% of pages. It is hard-coded and not backed by data.
- "✓ Verified Identifiers" heading on 40% of pages that show no licence or CMS number.
- "It operates as a other organization" on 100% of pages. Ownership is unknown, and the sentence is ungrammatical.
- "is a assisted living / adult day services / independent living / CCRC" grammar on 57% of pages.
- City pages for six care types show a care-wide price band labelled "Typical local range". It is not a local measurement.

Wrong category. These are name-filter matches, a lower bound that needs review, not proof:

- `scripts/seo/category_name_check.mjs` on the export (database rows, 2026-11-10):
  - Adult Day Services: 947 of 4,855 rows (19.5%), 946 of them in New York. Examples include family health centres, orthopaedic clinics, and middle schools.
  - Assisted Living: 1,599 rows, 1,567 of them in New York, including public and elementary schools (for example "PS 203 - School for Future Leaders").
- A broader one-off filter on the 78,239 canonical pages, which also matched "hospital", "medical", and "health center", found 1,663 of 4,380 adult-day pages (38%). Nearly all adult-day pages (4,346) are in New York.

## 4. Interpretation (judgment, not measurement)

- The largest gap is discovery and crawling. Most sampled URLs were never crawled, including a substantial guide page. Content quality alone does not explain that.
- Where Google did crawl, it declined to index, including the 3,500-word `/assisted-living/` hub. Thin, near-identical facility pages and wrong-category listings plausibly lower Google's view of the whole site, but the sample is too small to prove it.
- Facility pages differ mainly by name, address, and identifiers. A family learns little that distinguishes one facility from another beyond licence and contact details.

## 5. Next actions

1. Export the Search Console Pages report (UI) and the example URLs for "Crawled, currently not indexed" and "Discovered, currently not indexed". This is needed for any family-level correlation.
2. Remove the unsupported claims (hard-coded "Active", the misleading "Verified" heading, "other organization") and fix the a/an grammar. These are template-level, low-risk changes.
3. Review the New York adult-day and assisted-living categories. Correcting or excluding them changes categories and sitemap inclusion, so it needs approval.
4. Pilot richer facility content on one family with verified data only (licence status from the state, CMS quality data for nursing homes), with an unchanged control group.
5. Decide whether unknown paths should return a real 404 (needs approval; `public/_redirects`).
6. Re-inspect the same 18 URLs after recrawl and record the last-crawled dates.
