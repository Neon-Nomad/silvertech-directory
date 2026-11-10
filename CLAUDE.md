# SilverTech Directory: working notes for Claude

Read this first. `agent.md` is an outdated 2025 blueprint (Firebase, the old tier names). Do not follow it. `README.md` says Vercel; production deploys on Netlify.

## Architecture

- **Hybrid build.** Vite/React app shell (`App.tsx`, `features/`, `components/`, `src/`) plus Astro SEO routes (`astro-src/`). `scripts/merge_astro.mjs` merges the output into `dist`.
- **Backend.** Supabase: Postgres, RLS, RPCs, Auth. Migrations live in `supabase/migrations`. Proposed SQL that is not applied lives in `docs/proposed/`.
- **Production Supabase project ref:** `cqalqsyiiixbdoeabgyq`. Every script that touches data must check for it.
- **Deploy.** Netlify builds from `netlify.toml` and auto-deploys `main`. Serverless functions are in `netlify/functions/`.
- **Operator dashboard.** `features/operator/dashboard/` (`OperatorDashboard.tsx`, tabs: overview, listings, leads, qa, billing, vault, help). Routes are in `App.tsx`.
- **Config.** Plans and prices: `src/config/pricing.ts`. Activation events: `src/config/activationEvents.ts`.
- **Search.** Typesense index built by `scripts/typesense_index.ts`. It is run manually and has no schedule.
- **Stripe.** Out of scope until explicitly requested. Payment links are in `pricing.ts`.

## Commands

| Task | Command | Notes |
|---|---|---|
| Dev server | `npm run dev` | Vite |
| Type check | `npx tsc --noEmit` | Run before every commit |
| Unit tests | `npm run test:unit` | Vitest, about 355 tests |
| Lint | `npm run lint` | **Currently fails** on one pre-existing error at `astro-src/lib/seniorLivingData.ts:616`. It is not a regression. Check the error count before you act on it. |
| Full build | `npm run build:hybrid` | React plus Astro, merged into `dist` |
| E2E | `npm run test:e2e` | Playwright, tests in `e2e/` |
| Local app browser tests | `webapp-testing` skill | For localhost only |

## Security and production rules

These apply to every session. Do not treat them as optional.

- **Secrets.** Never print, paste, or log `.env` values, the Supabase service-role key, or access tokens. Read keys inside scripts only.
- **Database.**
  - Never run `supabase db push`, and never run the pending March migration.
  - Changes that touch auth, RLS, grants, or ownership go to `docs/proposed/` for review. Do not apply them.
  - Never delete or archive `raw_events`. No `VACUUM FULL`. No index drops based on zero scan counts. No table rewrites or GIN rebuilds without approval.
  - Do not weaken RLS, authentication, or Supabase Auth or email settings.
- **Production tests.**
  - Use designated test accounts (`zz-browser-*@example.test` pattern) and test facilities only.
  - Never claim a real facility, approve a real claim, change real ownership, touch existing paid assignments or the pending real claim, send real notifications, or create real charges.
  - Record every created record in a manifest. Cleanup must report zero residue, and failed cleanup must be reported.
- **Merging.**
  - Routine frontend PRs may merge after local checks pass and the Netlify checks have finished. Do not merge while checks are pending.
  - Database, auth, and security PRs need explicit approval.
- **Stripe.** Do not start Stripe work unless the user asks.

## Testing and verification

- Before committing, run `tsc` and the unit tests for the files you touched. Run the full unit suite before merging.
- Verify a deploy by fetching the live entry bundle and searching the lazy chunk it references (for example `OperatorDashboard-*.js`) for the expected strings. Confirm the chunk name changed first.
- Browser behavior needs a real browser run. Label API-only or code-only checks as such.
- When a check fails, stop. Keep the complete failing output in a file in the session scratchpad and cite its path. Do not summarize away error text.

## Efficient file reading

- Read files with `offset` and `limit`. Use Grep with `output_mode` set to `files_with_matches` first, and a `head_limit`.
- Use Glob for file names. Do not use `cat`, `sed`, `head`, `tail`, or `grep` in Bash to read file contents. Use Read and Grep.
- For test output, filter with `grep` or `tail`, or write it to a file and search that. Open the file only when a test fails.
- Run `git diff --stat` before a full diff. Do not dump generated or data files: `dist`, `public/*.json`, the facility shards, the CSVs.
- Do not re-read a file already read in this session unless it has changed.
- Keep worktrees to one per active branch. Remove a worktree after its PR merges and check that it is clean first. Scratch files go in the session scratchpad.

## Subagents

- Give a narrow brief and ask for a summary under about 800 words, with no file dumps and no transcripts.
- Use the Explore agent with "medium" thoroughness unless a broad search needs more.

## Repository conventions

- Git stores LF line endings. Windows checkouts convert them to CRLF, so a diff may look larger than the real change. Do not rewrite line endings.
- Do not generate TypeScript string literals with Python heredocs, because newlines break them. Write the file with the Write tool or use Node.
- Commit and PR bodies end with the attribution lines given in the session's system reminder.
