# Supervised backlog run: up to 4,000 lead events per run (runbook, not yet approved or run)

Written for: the production owner. Status: prepared. Nothing in this runbook has been executed. Each run needs your explicit approval and is launched by you.

## What changed in the pipeline (branch `pipeline-batch-guards`, from `main` at 71a8ec9)
- **Stops and aborts** (`scripts/lib/normalizationDiagnostics.ts`, `nextBatchAction`):
  - Systemic failure, rejection that cannot be recorded, or a duplicate in the backlog query: the run is marked `failed` and nothing more is written.
  - Any transient failure: the run stops after that batch and the event is retried by the next run.
  - More than 1% of a batch rejected (more than 2 of 200): the run stops after that batch for review.
  - Nothing fetched, or nothing written: the run stops.
- **Progress**: one `normalization_batch_summary` log line per batch. The `normalization_runs` row is updated after every batch, so an interrupted run still shows how far it got.
- **Run record**: `metadata` now includes `batches`, `duplicates`, `transient`, `rejection_write_failed` and `stop_reason`. A run that reaches the batch cap ends with `stop_reason: batch_limit_reached`.
- **Unchanged**: facility-entity normalization, the unsupported-entity path, the lineage work, and the batch size of 200.
- **Tests**: 26 passing. `tests/normalizationDiagnostics.test.ts` (20) and `tests/pipelineNormalizeBatchGuards.test.ts` (6). The second file runs the real loop against a fake Supabase client for each stop path. It does not touch a database.

## Preconditions (all must hold before any run)
1. The change is merged to `main`, and the clean clone is at that merge commit. A run must come from a reviewed commit.
2. The clean clone has no `.env` file and `git status` is clean.
3. The scheduled workflow is still disabled (`data-pipeline.yml`, state `disabled_inactivity` or `disabled_manually`).
4. In the production SQL Editor, run `backlog-reconcile-2026-11-08.sql`. `running_runs` must be `0`.
5. Run `B0-batch-counts.sql` and save the output as the before-counts for this run.
6. The shell has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set. Check the URL shape without printing it:
   `$env:SUPABASE_URL -match '^https://[a-z0-9]+\.supabase\.co$'` must print `True`.

## Command (one command per run, from the clean clone)
Change the log name for each run (`backlog-run-01.log`, `backlog-run-02.log`, and so on). Do not reuse a name.

```powershell
cd "C:\Users\majik\AppData\Local\Temp\claude\c--Users-majik-Documents-silvertech-directory\8b9c7443-df24-4469-a162-3f9ef9d9c6c8\scratchpad\preflight-clone"
$env:PIPELINE_NORMALIZE_BATCH_SIZE = "200"
$env:PIPELINE_NORMALIZE_MAX_BATCHES = "20"
npx.cmd tsx scripts/pipeline_normalize.ts *> backlog-run-01.log
Select-String -Path backlog-run-01.log -Pattern 'normalization_run_started|normalization_batch_summary|normalization_run_summary|Normalization complete'
Select-String -Path backlog-run-01.log -Pattern 'normalization_systemic_failure|normalization_transient_failure|normalization_rejection_write_failed|pipeline_normalize failed'
```

`20 batches x 200 = 4,000 events` at most. The first `Select-String` prints the progress and the summary. The second prints any failure line. Any line from the second command means the run stopped on a failure, so run the checks below before doing anything else.

## Expected outcome
- A clean run prints `batch_limit_reached` after 20 batches, or a stop reason from the table below.
- `normalization_batch_summary` lines show `"action":"continue"` until the last one.

| `stop_reason` | Meaning | Run status | What you do |
|---|---|---|---|
| `batch_limit_reached` | 20 batches done, backlog remains | `completed` | Reconcile. Approve the next run if you choose. |
| `no_fresh_events` | Backlog is empty | `completed` | Reconcile. Backlog cleared. |
| `transient_failure` | A timeout or connection error | `completed` | Reconcile. The next run retries the event. |
| `excessive_rejections` | More than 1% of a batch rejected | `completed` | Read the rejection codes, then decide. |
| `no_progress` | Nothing written in a batch | `completed` | Investigate before any run. |
| `systemic_failure` | Schema, permission or credential error | `failed` | Do not re-run until fixed. |
| `rejection_write_failed` | A rejection could not be recorded | `failed` | Do not re-run until fixed. |
| `duplicate_detected` | The backlog query returned an event twice | `failed` | Do not re-run until investigated. |

## Reconcile after every run
1. Run `backlog-reconcile-2026-11-08.sql`. `running_runs` must be `0` unless this run was interrupted (see below).
2. Run `B0-batch-counts.sql`. Compare with the before-counts:
   - `lead_events_never_attempted` fell by exactly `records_normalized + records_rejected` from the run summary.
   - `canonical_lead_event_rows` rose by exactly `records_normalized`.
   - Both `..._minus_distinct_raw_events` rows are `0`.
3. The newest run row's `records_scanned` equals `normalized + rejected` from the summary, and `duplicates` and `rejection_write_failed` are `0`.

Any mismatch means stop and report. Do not start another run.

## Interrupting a run
- Ctrl-C is safe for the events. Each event is written on its own, so an interruption leaves complete events and the rest pending.
- An interrupted run stays in status `running` because the script cannot close it. The next preflight shows it. Do not start a new run until you have decided what to do with that row.

## Blockers to unattended processing

These two limitations mean the backlog cannot be processed without an operator watching each run. They are recorded here as blockers, not accepted risks.

1. **Ctrl-C leaves a run in status `running`.** The script has no shutdown handler, so an interrupted run is never closed. The preflight check and the reconcile query catch it, but a person must clear it by hand. Unattended processing needs a handler that closes the run as `failed` with `stop_reason: interrupted` on SIGINT and SIGTERM.
2. **No automated time limit.** The procedure's 15-minute stop is a manual watch, not code. Unattended processing needs a wall-clock budget per run, checked between batches, that stops the run with a named reason.

Until both are fixed, each run needs a person to launch it, watch it, and reconcile it afterwards.

## Approval
- Each run of up to 4,000 events needs your explicit approval. About 97,160 events remain, so the backlog takes about 25 runs.
- The script does not start the next run by itself, and the scheduled workflow stays disabled.
- No time limit is built into the script. Watch the batch lines. If a run is slow, use Ctrl-C as described above, then reconcile before anything else.
