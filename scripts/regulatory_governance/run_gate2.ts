import fs from 'node:fs/promises';
import path from 'node:path';
import {
  GATE_CHECKS,
  LICENSE_STATUS_ENUM,
  MATCH_METHOD_ENUM,
  SCHEMA_VERSION,
  type CanonicalFacilityRecord,
  type CheckResult,
  type GateFailure,
} from './contracts.ts';

type CliOptions = {
  runDir: string;
  baselineRunDir: string | null;
};

type StateGate2Result = {
  state: string;
  comparedRecords: number;
  driftCount: number;
  failureCount: number;
  passed: boolean;
  baselineReferenceVersion: string | null;
  skippedDueToGate1Failure: boolean;
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DETERMINISTIC_METHODS = new Set(['exact_id', 'exact_name_zip', 'exact_name_city', 'state_direct_match']);

const normalizeText = (value: string | null | undefined): string =>
  (value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const comparisonKey = (record: CanonicalFacilityRecord): string => {
  if (record.cms_ccn) return `ccn:${record.state}|${normalizeText(record.cms_ccn)}`;
  return `sig:${record.state}|${normalizeText(record.facility_name)}|${normalizeText(record.address_line1)}|${normalizeText(
    record.postal_code
  )}`;
};

const safeJsonRead = async <T>(filePath: string): Promise<T | null> => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const parseCli = async (): Promise<CliOptions> => {
  const args = process.argv.slice(2);
  let runDir: string | null = null;
  let baselineRunDir: string | null = null;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--run-dir' && args[i + 1]) {
      runDir = path.resolve(process.cwd(), args[i + 1]);
      i += 1;
      continue;
    }
    if (arg === '--baseline-run-dir' && args[i + 1]) {
      baselineRunDir = path.resolve(process.cwd(), args[i + 1]);
      i += 1;
    }
  }

  if (!runDir) {
    const root = path.resolve(process.cwd(), 'artifacts', 'regulatory-governance-dev');
    const entries = await fs.readdir(root, { withFileTypes: true });
    const runs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    if (runs.length === 0) {
      throw new Error('No governance run directories found. Provide --run-dir.');
    }
    runDir = path.join(root, runs[runs.length - 1]);
    if (!baselineRunDir && runs.length > 1) {
      baselineRunDir = path.join(root, runs[runs.length - 2]);
    }
  }

  return { runDir, baselineRunDir };
};

const writeJson = async (filePath: string, payload: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
};

const buildCheckResults = (
  failures: GateFailure[],
  baselineReferenceVersion: string | null,
  comparedRecords: number,
  driftCount: number
): CheckResult[] => {
  const byCheck = new Map<string, number>();
  for (const failure of failures) {
    byCheck.set(failure.check_id, (byCheck.get(failure.check_id) || 0) + 1);
  }

  return [
    {
      check_id: GATE_CHECKS.G2_1.id,
      status: driftCount > 0 ? 'fail' : 'pass',
      severity: GATE_CHECKS.G2_1.severity,
      metric_value: comparedRecords > 0 ? driftCount : null,
      threshold: comparedRecords > 0 ? 0 : null,
      baseline_reference_version: baselineReferenceVersion,
    },
    {
      check_id: GATE_CHECKS.G2_2.id,
      status: (byCheck.get(GATE_CHECKS.G2_2.id) || 0) > 0 ? 'fail' : 'pass',
      severity: GATE_CHECKS.G2_2.severity,
      metric_value: byCheck.get(GATE_CHECKS.G2_2.id) || 0,
      threshold: 0,
      baseline_reference_version: baselineReferenceVersion,
    },
    {
      check_id: GATE_CHECKS.G2_3.id,
      status: (byCheck.get(GATE_CHECKS.G2_3.id) || 0) > 0 ? 'fail' : 'pass',
      severity: GATE_CHECKS.G2_3.severity,
      metric_value: byCheck.get(GATE_CHECKS.G2_3.id) || 0,
      threshold: 0,
      baseline_reference_version: baselineReferenceVersion,
    },
  ];
};

const collectStateDirs = async (runDir: string): Promise<string[]> => {
  const entries = await fs.readdir(runDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && /^[A-Z]{2}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
};

const runForState = async (
  runDir: string,
  baselineRunDir: string | null,
  state: string
): Promise<StateGate2Result> => {
  const stateDir = path.join(runDir, state);
  const currentRecords =
    (await safeJsonRead<CanonicalFacilityRecord[]>(path.join(stateDir, 'canonical_snapshot.json'))) || [];

  const currentDecision =
    (await safeJsonRead<{
      schema_version?: string;
      data_version?: string;
      approved_for_publish?: boolean;
    }>(path.join(stateDir, 'publish_decision.json'))) ||
    {};

  if (currentDecision.approved_for_publish === false) {
    const skipCheckResults: CheckResult[] = [
      {
        check_id: GATE_CHECKS.G2_1.id,
        status: 'pass',
        severity: GATE_CHECKS.G2_1.severity,
        metric_value: null,
        threshold: null,
        baseline_reference_version: null,
      },
      {
        check_id: GATE_CHECKS.G2_2.id,
        status: 'pass',
        severity: GATE_CHECKS.G2_2.severity,
        metric_value: null,
        threshold: null,
        baseline_reference_version: null,
      },
      {
        check_id: GATE_CHECKS.G2_3.id,
        status: 'pass',
        severity: GATE_CHECKS.G2_3.severity,
        metric_value: null,
        threshold: null,
        baseline_reference_version: null,
      },
    ];

    const driftReport = {
      state,
      schema_version: currentDecision.schema_version || SCHEMA_VERSION,
      data_version: currentDecision.data_version || null,
      baseline_reference_version: null,
      baseline_available: false,
      compared_records: 0,
      drift_count: 0,
      drift_examples: [],
      skipped_due_to_gate1_failure: true,
      created_at: new Date().toISOString(),
    };

    await writeJson(path.join(stateDir, 'gate2_drift_report.json'), driftReport);
    await writeJson(path.join(stateDir, 'gate2_failures.json'), []);
    await writeJson(path.join(stateDir, 'gate2_check_results.json'), skipCheckResults);

    return {
      state,
      comparedRecords: 0,
      driftCount: 0,
      failureCount: 0,
      passed: true,
      baselineReferenceVersion: null,
      skippedDueToGate1Failure: true,
    };
  }

  let baselineRecords: CanonicalFacilityRecord[] = [];
  let baselineReferenceVersion: string | null = null;
  if (baselineRunDir) {
    const baselineStateDir = path.join(baselineRunDir, state);
    const baselineDecision = await safeJsonRead<{
      approved_for_publish?: boolean;
      schema_version?: string;
      data_version?: string;
    }>(path.join(baselineStateDir, 'publish_decision.json'));

    if (baselineDecision?.approved_for_publish === true && baselineDecision.schema_version === SCHEMA_VERSION) {
      baselineRecords =
        (await safeJsonRead<CanonicalFacilityRecord[]>(path.join(baselineStateDir, 'canonical_snapshot.json'))) || [];
      baselineReferenceVersion = baselineDecision.data_version || null;
    }
  }

  const failures: GateFailure[] = [];

  const statusMap = new Map<string, Set<string>>();
  for (let index = 0; index < currentRecords.length; index += 1) {
    const record = currentRecords[index];
    const rawStatus = (record.license_status_raw || '').trim().toLowerCase();
    if (rawStatus.length > 0) {
      const set = statusMap.get(rawStatus) || new Set<string>();
      set.add(record.license_status);
      statusMap.set(rawStatus, set);
    }
  }
  for (const [rawStatus, normalizedSet] of statusMap.entries()) {
    if (normalizedSet.size > 1) {
      failures.push({
        check_id: GATE_CHECKS.G2_2.id,
        severity: GATE_CHECKS.G2_2.severity,
        state,
        record_index: -1,
        facility_id: 'state_level',
        field: 'license_status',
        reason: `Non-deterministic normalization for raw status "${rawStatus}" -> [${Array.from(normalizedSet).join(', ')}]`,
      });
    }
  }

  for (let index = 0; index < currentRecords.length; index += 1) {
    const record = currentRecords[index];
    const stringFields: Array<keyof CanonicalFacilityRecord> = [
      'facility_name',
      'address_line1',
      'city',
      'state',
      'postal_code',
      'issuing_agency',
      'last_verified_date',
    ];
    for (const field of stringFields) {
      const value = record[field];
      if (typeof value === 'string' && value !== value.trim()) {
        failures.push({
          check_id: GATE_CHECKS.G2_3.id,
          severity: GATE_CHECKS.G2_3.severity,
          state,
          record_index: index,
          facility_id: record.facility_id,
          field,
          reason: 'String field contains leading or trailing whitespace',
        });
      }
    }

    if (!/^[A-Z]{2}$/.test(record.state)) {
      failures.push({
        check_id: GATE_CHECKS.G2_3.id,
        severity: GATE_CHECKS.G2_3.severity,
        state,
        record_index: index,
        facility_id: record.facility_id,
        field: 'state',
        reason: 'State code must be uppercase USPS two-letter format',
      });
    }

    const dateFields: Array<keyof CanonicalFacilityRecord> = [
      'license_issue_date',
      'license_expiration_date',
      'last_verified_date',
    ];
    for (const field of dateFields) {
      const value = record[field];
      if (value !== null && typeof value === 'string' && !ISO_DATE_RE.test(value)) {
        failures.push({
          check_id: GATE_CHECKS.G2_3.id,
          severity: GATE_CHECKS.G2_3.severity,
          state,
          record_index: index,
          facility_id: record.facility_id,
          field,
          reason: 'Normalized date must be YYYY-MM-DD',
        });
      }
    }

    if (record.match_confidence !== null && (record.match_confidence < 0 || record.match_confidence > 1)) {
      failures.push({
        check_id: GATE_CHECKS.G2_3.id,
        severity: GATE_CHECKS.G2_3.severity,
        state,
        record_index: index,
        facility_id: record.facility_id,
        field: 'match_confidence',
        reason: 'match_confidence must be in [0,1] when present',
      });
    }

    if (DETERMINISTIC_METHODS.has(record.match_method) && record.match_confidence !== 1) {
      failures.push({
        check_id: GATE_CHECKS.G2_3.id,
        severity: GATE_CHECKS.G2_3.severity,
        state,
        record_index: index,
        facility_id: record.facility_id,
        field: 'match_confidence',
        reason: 'Deterministic match_method requires match_confidence=1.0',
      });
    }

    if (!LICENSE_STATUS_ENUM.includes(record.license_status) || !MATCH_METHOD_ENUM.includes(record.match_method)) {
      failures.push({
        check_id: GATE_CHECKS.G2_2.id,
        severity: GATE_CHECKS.G2_2.severity,
        state,
        record_index: index,
        facility_id: record.facility_id,
        field: 'enum',
        reason: 'Normalized enum value outside controlled vocabulary',
      });
    }
  }

  const baselineByKey = new Map<string, CanonicalFacilityRecord>();
  for (const record of baselineRecords) {
    baselineByKey.set(comparisonKey(record), record);
  }

  let comparedRecords = 0;
  let driftCount = 0;
  const driftExamples: Array<{ key: string; previous: string; current: string }> = [];
  for (let index = 0; index < currentRecords.length; index += 1) {
    const record = currentRecords[index];
    const key = comparisonKey(record);
    const baseline = baselineByKey.get(key);
    if (!baseline) continue;
    comparedRecords += 1;
    if (baseline.facility_id !== record.facility_id) {
      driftCount += 1;
      if (driftExamples.length < 50) {
        driftExamples.push({ key, previous: baseline.facility_id, current: record.facility_id });
      }
      failures.push({
        check_id: GATE_CHECKS.G2_1.id,
        severity: GATE_CHECKS.G2_1.severity,
        state,
        record_index: index,
        facility_id: record.facility_id,
        field: 'facility_id',
        reason: `Deterministic facility_id drift detected for key ${key}`,
      });
    }
  }

  const checkResults = buildCheckResults(failures, baselineReferenceVersion, comparedRecords, driftCount);
  const hardFail = checkResults.some((result) => result.severity === 'hard' && result.status === 'fail');

  const driftReport = {
    state,
    schema_version: currentDecision.schema_version || SCHEMA_VERSION,
    data_version: currentDecision.data_version || null,
    baseline_reference_version: baselineReferenceVersion,
    baseline_available: baselineReferenceVersion !== null,
    compared_records: comparedRecords,
    drift_count: driftCount,
    drift_examples: driftExamples,
    created_at: new Date().toISOString(),
  };

  await writeJson(path.join(stateDir, 'gate2_drift_report.json'), driftReport);
  await writeJson(path.join(stateDir, 'gate2_failures.json'), failures);
  await writeJson(path.join(stateDir, 'gate2_check_results.json'), checkResults);

  return {
    state,
    comparedRecords,
    driftCount,
    failureCount: failures.length,
    passed: !hardFail,
    baselineReferenceVersion,
    skippedDueToGate1Failure: false,
  };
};

const main = async () => {
  const options = await parseCli();
  const states = await collectStateDirs(options.runDir);
  if (states.length === 0) {
    throw new Error(`No state artifact directories found in ${options.runDir}`);
  }

  const results: StateGate2Result[] = [];
  for (const state of states) {
    const result = await runForState(options.runDir, options.baselineRunDir, state);
    results.push(result);
    console.log(
      `[${result.passed ? 'PASS' : 'FAIL'}] ${state} compared=${result.comparedRecords} drift=${result.driftCount} failures=${result.failureCount}${
        result.skippedDueToGate1Failure ? ' (skipped: gate1 failed)' : ''
      }`
    );
  }

  const failed = results.filter((result) => !result.passed).length;
  const summary = {
    run_dir: options.runDir,
    baseline_run_dir: options.baselineRunDir,
    generated_at: new Date().toISOString(),
    state_count: results.length,
    passed_state_count: results.length - failed,
    failed_state_count: failed,
    states: results,
  };

  await writeJson(path.join(options.runDir, 'gate2_summary.json'), summary);

  if (failed > 0) {
    console.error(`Gate 2 failed for ${failed}/${results.length} states. See ${path.join(options.runDir, 'gate2_summary.json')}`);
    process.exit(1);
  }

  console.log(`Gate 2 passed for ${results.length}/${results.length} states.`);
};

main().catch((error) => {
  console.error('run_gate2 crashed:', error);
  process.exit(1);
});
