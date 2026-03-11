# Regulatory Governance Gate 1

This script is the first implementation slice of the locked governance stack.

It runs deterministic Gate 1 checks (`G1.1` through `G1.6`) against root-level state licensing JSON files and emits immutable run artifacts per state.

## Command

```bash
npm run governance:gate1
```

```bash
npm run governance:gate2 -- --run-dir artifacts/regulatory-governance-dev/<run_id> --baseline-run-dir artifacts/regulatory-governance-dev/<baseline_run_id>
```

```bash
npm run governance:gate3 -- --run-dir artifacts/regulatory-governance-dev/<run_id> --baseline-run-dir artifacts/regulatory-governance-dev/<baseline_run_id>
```

```bash
npm run governance:run -- --output-root artifacts/regulatory-governance-dev --data-version 2026-02-28.v1
```

```bash
npm run governance:promote -- \
  --source-run-dir artifacts/regulatory-governance-dev/<run_id> \
  --target-root artifacts/regulatory-governance-prod \
  --source-environment staging \
  --target-environment prod \
  --approved-by "Data Steward" \
  --all-approved
```

Optional flags:

```bash
npx tsx scripts/regulatory_governance/run_gate1.ts \
  --file florida_nursing_homes_with_licenses.json \
  --output-root artifacts/regulatory-governance \
  --data-version 2026-02-28.v1 \
  --baseline-reference-version 2026-02-27.v1
```

## Current Scope

- Input integrity manifest per state.
- Canonical record mapping into `facility_record_v1` shape.
- Hard-fail Gate 1 checks:
  - `G1.1` canonical key contract.
  - `G1.2` required key presence.
  - `G1.3` controlled vocabulary checks.
  - `G1.4` license availability business rules.
  - `G1.5` date format checks.
  - `G1.6` lat/lng pair consistency.
- Artifact emission:
  - `input_manifest.json`
  - `gate1_failures.json`
  - `gate1_check_results.json`
  - `publish_decision.json`
  - `qa_metrics.json`
  - `canonical_snapshot.json`
  - `artifact_bundle.json`
  - run-level `run_summary.json`

Gate 2 scope:

- `G2.1` facility ID drift detection against baseline snapshot.
- `G2.2` deterministic status normalization consistency checks.
- `G2.3` normalization constraints (string trim, state code, date format, deterministic confidence).
- Artifact emission:
  - `gate2_drift_report.json`
  - `gate2_failures.json`
  - `gate2_check_results.json`
  - run-level `gate2_summary.json`

If a state fails Gate 1 in the same run, Gate 2 marks that state as skipped and does not apply an additional hard fail.

Gate 3 scope:

- `G3.1` uniqueness: `(state, state_license_number)` where publicly available.
- `G3.2` uniqueness: `(state, license_id)` where present.
- `G3.3` deterministic duplicate signature check:
  - `lower(trim(facility_name))|lower(trim(address_line1))|postal_code`
- Promote checks:
  - `G3.4` record-count drop vs baseline (small-state guardrail).
  - `G3.5` unmatched-rate threshold and status-normalization failures.
  - `G3.6` publicly-available license null rate > 2%.
  - `G3.7` match-confidence average < 0.80.
- `G3.8` golden fixture mismatch check if fixture config exists.
- Publish decision synthesis:
  - promote checks convert to hard fail before any override path.
  - writes final `publish_decision.json`.

Gate 3 artifacts:

- `gate3_failures.json`
- `gate3_check_results.json`
- `gate3_details.json`
- run-level `gate3_summary.json`

Orchestrator artifact:

- `governance_run_summary.json` (in the run directory)
- Runs Gate 1 -> Gate 2 -> Gate 3 automatically with run-dir and baseline handoff.

Promotion artifacts:

- Per promoted state:
  - `states/<STATE>/<data_version>_<snapshot_hash_prefix>/promotion_manifest.json`
  - `states/<STATE>/current.json` pointer (atomic update)
- Run-level:
  - `promotions/<timestamp>/promotion_manifest.json`

Promotion rules enforced:

- Source state must have `approved_for_publish=true`.
- Source Gate 3 checks must all be `pass`.
- Promotion unit is immutable: `{state, schema_version, data_version, snapshot_hash}`.
- State-level isolation: blocked states do not prevent other promotable states from writing artifacts.
- `--all-approved` limits promotion candidates to states already approved in source artifacts.
- If source `publish_decision.override_used=true`, dual sign-off is required:
  - `--approved-by` and `--approved-by-secondary`
  - promotion is blocked if secondary sign-off is missing.
- Optional strict mode:
  - `--require-dual-signoff-all`
  - requires `--approved-by-secondary` for every promoted state, even without overrides.

## Check Result Contract

Every check emits:

- `check_id`
- `status` (`pass|fail|promote`)
- `severity` (`soft|hard|promote`)
- `metric_value`
- `threshold`
- `baseline_reference_version`

## Exit Behavior

- Exit `0`: all processed states pass Gate 1.
- Exit `1`: one or more states fail Gate 1.

This allows fail-fast integration into CI/CD.
