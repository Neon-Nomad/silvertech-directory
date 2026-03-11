import fs from 'node:fs/promises';
import path from 'node:path';
import {
  GATE_CHECKS,
  PIPELINE_POLICY_VERSION,
  SCHEMA_VERSION,
  type CanonicalFacilityRecord,
  type CheckResult,
  type GateFailure,
} from './contracts.ts';

type CliOptions = {
  runDir: string;
  baselineRunDir: string | null;
};

type PublishDecision = {
  state: string;
  schema_version: string;
  data_version: string | null;
  snapshot_hash: string | null;
  baseline_reference_version: string | null;
  enforcement_scope: string;
  passed_gates: string[];
  failed_gates: string[];
  severity: 'soft' | 'hard';
  thresholds_triggered: string[];
  approved_for_publish: boolean;
  requires_additional_gates: boolean;
  override_used: boolean;
  qa_override_flag: boolean;
  policy_version: string;
  created_at: string;
  override_reason?: string;
  overridden_gates?: string[];
  approved_by?: string;
  approval_timestamp?: string;
  override_cycle_id?: string;
};

type StateGate3Result = {
  state: string;
  failureCount: number;
  promoteTriggerCount: number;
  approvedForPublish: boolean;
  skippedDueToUpstreamFailure: boolean;
  baselineReferenceVersion: string | null;
};

type BaselineState = {
  records: CanonicalFacilityRecord[];
  dataVersion: string | null;
};

const UNMATCHED_METHOD = 'unmatched';

const normalizeText = (value: string | null | undefined): string =>
  (value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const safeJsonRead = async <T>(filePath: string): Promise<T | null> => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const writeJson = async (filePath: string, payload: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
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

const collectStateDirs = async (runDir: string): Promise<string[]> => {
  const entries = await fs.readdir(runDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && /^[A-Z]{2}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
};

const buildHardCheck = (
  checkId: string,
  failCount: number,
  baselineReferenceVersion: string | null
): CheckResult => ({
  check_id: checkId,
  status: failCount > 0 ? 'fail' : 'pass',
  severity: 'hard',
  metric_value: failCount,
  threshold: 0,
  baseline_reference_version: baselineReferenceVersion,
});

const buildPromoteCheck = (
  checkId: string,
  triggered: boolean,
  metricValue: number | null,
  threshold: number | null,
  baselineReferenceVersion: string | null
): CheckResult => ({
  check_id: checkId,
  status: triggered ? 'promote' : 'pass',
  severity: 'promote',
  metric_value: metricValue,
  threshold,
  baseline_reference_version: baselineReferenceVersion,
});

const getBaselineState = async (baselineRunDir: string | null, state: string): Promise<BaselineState | null> => {
  if (!baselineRunDir) return null;
  const stateDir = path.join(baselineRunDir, state);
  const decision = await safeJsonRead<PublishDecision>(path.join(stateDir, 'publish_decision.json'));
  if (!decision) return null;
  if (decision.approved_for_publish !== true || decision.schema_version !== SCHEMA_VERSION) return null;
  const records = await safeJsonRead<CanonicalFacilityRecord[]>(path.join(stateDir, 'canonical_snapshot.json'));
  if (!records) return null;
  return {
    records,
    dataVersion: decision.data_version || null,
  };
};

const computeLicenseNullRate = (records: CanonicalFacilityRecord[]): { numerator: number; denominator: number; rate: number } => {
  const denominator = records.filter((record) => record.license_publicly_available === true).length;
  const numerator = records.filter(
    (record) => record.license_publicly_available === true && record.state_license_number === null
  ).length;
  return {
    numerator,
    denominator,
    rate: denominator === 0 ? 0 : numerator / denominator,
  };
};

const computeMatchConfidenceAverage = (records: CanonicalFacilityRecord[]): number | null => {
  const values = records
    .map((record) => record.match_confidence)
    .filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Number((sum / values.length).toFixed(6));
};

const computeUnmatchedRate = (records: CanonicalFacilityRecord[]): { unmatched: number; total: number; rate: number } => {
  const total = records.length;
  const unmatched = records.filter((record) => record.match_method === UNMATCHED_METHOD).length;
  return {
    unmatched,
    total,
    rate: total === 0 ? 0 : unmatched / total,
  };
};

const stateIsSmall = (recordsCount: number): boolean => recordsCount < 100;

const countUniqueDuplicates = (values: string[]): number => {
  const grouped = new Map<string, number>();
  for (const value of values) {
    grouped.set(value, (grouped.get(value) || 0) + 1);
  }
  let duplicates = 0;
  for (const count of grouped.values()) {
    if (count > 1) duplicates += count;
  }
  return duplicates;
};

const runForState = async (runDir: string, baselineRunDir: string | null, state: string): Promise<StateGate3Result> => {
  const stateDir = path.join(runDir, state);
  const records = (await safeJsonRead<CanonicalFacilityRecord[]>(path.join(stateDir, 'canonical_snapshot.json'))) || [];
  const gate1Checks = (await safeJsonRead<CheckResult[]>(path.join(stateDir, 'gate1_check_results.json'))) || [];
  const gate2Summary = (await safeJsonRead<{
    skipped_due_to_gate1_failure?: boolean;
  }>(path.join(stateDir, 'gate2_drift_report.json'))) || {};
  const gate2Checks = (await safeJsonRead<CheckResult[]>(path.join(stateDir, 'gate2_check_results.json'))) || [];
  const existingDecision =
    (await safeJsonRead<PublishDecision>(path.join(stateDir, 'publish_decision.json'))) || ({} as PublishDecision);

  const gate1Failed = gate1Checks.some((check) => check.severity === 'hard' && check.status === 'fail');
  const gate2Failed = gate2Checks.some((check) => check.severity === 'hard' && check.status === 'fail');
  const skippedDueToUpstreamFailure = gate1Failed || gate2Failed || gate2Summary.skipped_due_to_gate1_failure === true;

  const baseline = await getBaselineState(baselineRunDir, state);
  const baselineReferenceVersion = baseline?.dataVersion || null;

  if (skippedDueToUpstreamFailure) {
    const checkResults: CheckResult[] = [
      buildHardCheck(GATE_CHECKS.G3_1.id, 0, baselineReferenceVersion),
      buildHardCheck(GATE_CHECKS.G3_2.id, 0, baselineReferenceVersion),
      buildHardCheck(GATE_CHECKS.G3_3.id, 0, baselineReferenceVersion),
      buildPromoteCheck(GATE_CHECKS.G3_4.id, false, null, null, baselineReferenceVersion),
      buildPromoteCheck(GATE_CHECKS.G3_5.id, false, null, null, baselineReferenceVersion),
      buildPromoteCheck(GATE_CHECKS.G3_6.id, false, null, null, baselineReferenceVersion),
      buildPromoteCheck(GATE_CHECKS.G3_7.id, false, null, null, baselineReferenceVersion),
      buildHardCheck(GATE_CHECKS.G3_8.id, 0, baselineReferenceVersion),
    ];
    const now = new Date().toISOString();
    const publishDecision: PublishDecision = {
      state,
      schema_version: existingDecision.schema_version || SCHEMA_VERSION,
      data_version: existingDecision.data_version || null,
      snapshot_hash: existingDecision.snapshot_hash || null,
      baseline_reference_version: baselineReferenceVersion,
      enforcement_scope: 'gate3_publish_guard',
      passed_gates: [],
      failed_gates: ['G1_or_G2'],
      severity: 'hard',
      thresholds_triggered: [],
      approved_for_publish: false,
      requires_additional_gates: false,
      override_used: false,
      qa_override_flag: false,
      policy_version: PIPELINE_POLICY_VERSION,
      created_at: now,
    };
    await writeJson(path.join(stateDir, 'gate3_failures.json'), []);
    await writeJson(path.join(stateDir, 'gate3_check_results.json'), checkResults);
    await writeJson(path.join(stateDir, 'publish_decision.json'), publishDecision);
    return {
      state,
      failureCount: 0,
      promoteTriggerCount: 0,
      approvedForPublish: false,
      skippedDueToUpstreamFailure: true,
      baselineReferenceVersion,
    };
  }

  const failures: GateFailure[] = [];
  const now = new Date().toISOString();

  const publicLicenseValues = records
    .filter((record) => record.license_publicly_available === true && record.state_license_number !== null)
    .map((record) => `${record.state}|${normalizeText(record.state_license_number || '')}`);
  const publicLicenseDuplicates = countUniqueDuplicates(publicLicenseValues);
  if (publicLicenseDuplicates > 0) {
    failures.push({
      check_id: GATE_CHECKS.G3_1.id,
      severity: GATE_CHECKS.G3_1.severity,
      state,
      record_index: -1,
      facility_id: 'state_level',
      field: 'state_license_number',
      reason: 'Duplicate (state, state_license_number) detected where license_publicly_available=true',
    });
  }

  const licenseIdValues = records
    .filter((record) => record.license_id !== null)
    .map((record) => `${record.state}|${normalizeText(record.license_id || '')}`);
  const licenseIdDuplicates = countUniqueDuplicates(licenseIdValues);
  if (licenseIdDuplicates > 0) {
    failures.push({
      check_id: GATE_CHECKS.G3_2.id,
      severity: GATE_CHECKS.G3_2.severity,
      state,
      record_index: -1,
      facility_id: 'state_level',
      field: 'license_id',
      reason: 'Duplicate (state, license_id) detected',
    });
  }

  const signatureValues = records.map(
    (record) => `${normalizeText(record.facility_name)}|${normalizeText(record.address_line1)}|${normalizeText(record.postal_code)}`
  );
  const duplicateSignatureCount = countUniqueDuplicates(signatureValues);
  if (duplicateSignatureCount > 0) {
    failures.push({
      check_id: GATE_CHECKS.G3_3.id,
      severity: GATE_CHECKS.G3_3.severity,
      state,
      record_index: -1,
      facility_id: 'state_level',
      field: 'facility_signature',
      reason: 'Duplicate deterministic facility signature detected',
    });
  }

  const statusNormalizationFailures = records.filter(
    (record) => record.license_status_raw !== null && record.license_status === 'unknown'
  ).length;
  if (statusNormalizationFailures > 0) {
    failures.push({
      check_id: GATE_CHECKS.G3_5.id,
      severity: GATE_CHECKS.G3_5.severity,
      state,
      record_index: -1,
      facility_id: 'state_level',
      field: 'license_status',
      reason: 'Status normalization failures detected (raw present but normalized unknown)',
    });
  }

  const fixturesPath = path.resolve(process.cwd(), 'config', 'regulatory_golden_fixtures.json');
  const fixtureSpec = await safeJsonRead<{ states?: Record<string, unknown[]> }>(fixturesPath);
  const fixtureRecords = fixtureSpec?.states?.[state] || [];
  let fixtureMismatchCount = 0;
  if (Array.isArray(fixtureRecords) && fixtureRecords.length > 0) {
    const byFacilityId = new Map<string, CanonicalFacilityRecord>();
    for (const record of records) {
      byFacilityId.set(record.facility_id, record);
    }
    for (const fixture of fixtureRecords as Array<Record<string, unknown>>) {
      const fixtureId = typeof fixture.facility_id === 'string' ? fixture.facility_id : null;
      if (!fixtureId || !byFacilityId.has(fixtureId)) {
        fixtureMismatchCount += 1;
      }
    }
    if (fixtureMismatchCount > 0) {
      failures.push({
        check_id: GATE_CHECKS.G3_8.id,
        severity: GATE_CHECKS.G3_8.severity,
        state,
        record_index: -1,
        facility_id: 'state_level',
        field: 'golden_fixture',
        reason: `Golden fixture mismatch count=${fixtureMismatchCount}`,
      });
    }
  }

  const unmatched = computeUnmatchedRate(records);
  const licenseNullRate = computeLicenseNullRate(records);
  const matchConfidenceAvg = computeMatchConfidenceAverage(records);

  const baselineCount = baseline?.records.length ?? null;
  const countDropCount =
    baselineCount && baselineCount > 0 && records.length < baselineCount ? baselineCount - records.length : 0;
  const countDropRate = baselineCount && baselineCount > 0 ? countDropCount / baselineCount : null;
  const smallState = stateIsSmall(baselineCount ?? records.length);

  const countDropThresholdRate = 0.3;
  const countDropThresholdAbsolute = smallState ? 5 : null;
  const countDropThresholdCount =
    baselineCount && baselineCount > 0
      ? Math.max(baselineCount * countDropThresholdRate, countDropThresholdAbsolute ?? 0)
      : null;
  const g3_4_triggered =
    baselineCount !== null && countDropThresholdCount !== null ? countDropCount > countDropThresholdCount : false;

  const unmatchedThresholdRate = 0.15;
  const unmatchedThresholdAbsolute = smallState ? 10 : null;
  const unmatchedThresholdAsRate = unmatched.total > 0 && unmatchedThresholdAbsolute !== null ? unmatchedThresholdAbsolute / unmatched.total : 0;
  const unmatchedThresholdFinal = Math.max(unmatchedThresholdRate, unmatchedThresholdAsRate);
  const g3_5_triggered = unmatched.rate > unmatchedThresholdFinal || statusNormalizationFailures > 0;

  const g3_6_triggered = licenseNullRate.rate > 0.02;
  const g3_7_triggered = matchConfidenceAvg !== null ? matchConfidenceAvg < 0.8 : false;

  const checkResults: CheckResult[] = [
    buildHardCheck(GATE_CHECKS.G3_1.id, publicLicenseDuplicates, baselineReferenceVersion),
    buildHardCheck(GATE_CHECKS.G3_2.id, licenseIdDuplicates, baselineReferenceVersion),
    buildHardCheck(GATE_CHECKS.G3_3.id, duplicateSignatureCount, baselineReferenceVersion),
    buildPromoteCheck(
      GATE_CHECKS.G3_4.id,
      g3_4_triggered,
      countDropRate,
      countDropThresholdRate,
      baselineReferenceVersion
    ),
    buildPromoteCheck(
      GATE_CHECKS.G3_5.id,
      g3_5_triggered,
      unmatched.rate,
      unmatchedThresholdFinal,
      baselineReferenceVersion
    ),
    buildPromoteCheck(GATE_CHECKS.G3_6.id, g3_6_triggered, licenseNullRate.rate, 0.02, baselineReferenceVersion),
    buildPromoteCheck(GATE_CHECKS.G3_7.id, g3_7_triggered, matchConfidenceAvg, 0.8, baselineReferenceVersion),
    buildHardCheck(GATE_CHECKS.G3_8.id, fixtureMismatchCount, baselineReferenceVersion),
  ];

  const hardFailed = checkResults.some((check) => check.severity === 'hard' && check.status === 'fail');
  const promotedToHard = checkResults
    .filter((check) => check.severity === 'promote' && check.status === 'promote')
    .map((check) => check.check_id);
  const approvedForPublish = !hardFailed && promotedToHard.length === 0;

  const publishDecision: PublishDecision = {
    state,
    schema_version: existingDecision.schema_version || SCHEMA_VERSION,
    data_version: existingDecision.data_version || null,
    snapshot_hash: existingDecision.snapshot_hash || null,
    baseline_reference_version: baselineReferenceVersion,
    enforcement_scope: 'gate3_publish_guard',
    passed_gates: approvedForPublish ? ['G1', 'G2', 'G3'] : ['G1', 'G2'],
    failed_gates: approvedForPublish ? [] : ['G3'],
    severity: approvedForPublish ? 'soft' : 'hard',
    thresholds_triggered: promotedToHard,
    approved_for_publish: approvedForPublish,
    requires_additional_gates: false,
    override_used: false,
    qa_override_flag: false,
    policy_version: PIPELINE_POLICY_VERSION,
    created_at: now,
  };

  const gate3Details = {
    state,
    baseline_reference_version: baselineReferenceVersion,
    baseline_records: baselineCount,
    current_records: records.length,
    count_drop_count: countDropCount,
    count_drop_rate: countDropRate,
    count_drop_threshold_count: countDropThresholdCount,
    small_state: smallState,
    unmatched_rate: unmatched.rate,
    unmatched_count: unmatched.unmatched,
    unmatched_threshold: unmatchedThresholdFinal,
    license_null_rate: licenseNullRate.rate,
    license_null_rate_numerator: licenseNullRate.numerator,
    license_null_rate_denominator: licenseNullRate.denominator,
    match_confidence_avg: matchConfidenceAvg,
    status_normalization_failures: statusNormalizationFailures,
    duplicate_state_license_count: publicLicenseDuplicates,
    duplicate_license_id_count: licenseIdDuplicates,
    duplicate_signature_count: duplicateSignatureCount,
    fixture_count: Array.isArray(fixtureRecords) ? fixtureRecords.length : 0,
    fixture_mismatch_count: fixtureMismatchCount,
    promote_to_hard_before_override: true,
    overridden_gates_required_if_override: true,
    created_at: now,
  };

  await writeJson(path.join(stateDir, 'gate3_failures.json'), failures);
  await writeJson(path.join(stateDir, 'gate3_check_results.json'), checkResults);
  await writeJson(path.join(stateDir, 'gate3_details.json'), gate3Details);
  await writeJson(path.join(stateDir, 'publish_decision.json'), publishDecision);

  return {
    state,
    failureCount: failures.length,
    promoteTriggerCount: promotedToHard.length,
    approvedForPublish,
    skippedDueToUpstreamFailure: false,
    baselineReferenceVersion,
  };
};

const main = async () => {
  const options = await parseCli();
  const states = await collectStateDirs(options.runDir);
  if (states.length === 0) {
    throw new Error(`No state artifact directories found in ${options.runDir}`);
  }

  const results: StateGate3Result[] = [];
  for (const state of states) {
    const result = await runForState(options.runDir, options.baselineRunDir, state);
    results.push(result);
    console.log(
      `[${result.approvedForPublish ? 'PASS' : 'FAIL'}] ${state} failures=${result.failureCount} promoteTriggers=${result.promoteTriggerCount}${
        result.skippedDueToUpstreamFailure ? ' (skipped: upstream failure)' : ''
      }`
    );
  }

  const approvedStateCount = results.filter((result) => result.approvedForPublish).length;
  const failedStateCount = results.length - approvedStateCount;
  const summary = {
    run_dir: options.runDir,
    baseline_run_dir: options.baselineRunDir,
    generated_at: new Date().toISOString(),
    state_count: results.length,
    approved_state_count: approvedStateCount,
    failed_state_count: failedStateCount,
    states: results,
  };

  await writeJson(path.join(options.runDir, 'gate3_summary.json'), summary);

  if (failedStateCount > 0) {
    console.error(`Gate 3 failed for ${failedStateCount}/${results.length} states. See ${path.join(options.runDir, 'gate3_summary.json')}`);
    process.exit(1);
  }

  console.log(`Gate 3 passed for ${approvedStateCount}/${results.length} states.`);
};

main().catch((error) => {
  console.error('run_gate3 crashed:', error);
  process.exit(1);
});
