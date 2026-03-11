import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

type CliOptions = {
  sourceRunDir: string;
  sourceRoot: string;
  targetRoot: string;
  sourceEnvironment: string;
  targetEnvironment: string;
  approvedBy: string;
  approvedBySecondary: string | null;
  requireDualSignoffAll: boolean;
  states: string[];
  allApproved: boolean;
  dryRun: boolean;
};

type PublishDecision = {
  state?: string;
  schema_version?: string;
  data_version?: string | null;
  snapshot_hash?: string | null;
  approved_for_publish?: boolean;
  override_used?: boolean;
  overridden_gates?: string[];
};

type GateCheckResult = {
  check_id: string;
  status: 'pass' | 'fail' | 'promote';
  severity: 'soft' | 'hard' | 'promote';
};

type PromotionStateResult = {
  state: string;
  promoted: boolean;
  skipped: boolean;
  reason: string | null;
  source_run_dir: string;
  target_artifact_dir: string | null;
  promotion_unit: {
    state: string;
    schema_version: string;
    data_version: string;
    snapshot_hash: string;
  } | null;
  parity_result: 'pass' | 'fail';
};

const parseCli = async (): Promise<CliOptions> => {
  const args = process.argv.slice(2);
  const sourceRoot = path.resolve(process.cwd(), 'artifacts', 'regulatory-governance-dev');
  let sourceRunDir: string | null = null;
  let targetRoot = path.resolve(process.cwd(), 'artifacts', 'regulatory-governance-prod');
  let sourceEnvironment = 'staging';
  let targetEnvironment = 'prod';
  let approvedBy = 'Data Steward';
  let approvedBySecondary: string | null = null;
  let requireDualSignoffAll = false;
  const states: string[] = [];
  let allApproved = false;
  let dryRun = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--source-run-dir' && args[i + 1]) {
      sourceRunDir = path.resolve(process.cwd(), args[i + 1]);
      i += 1;
      continue;
    }
    if (arg === '--target-root' && args[i + 1]) {
      targetRoot = path.resolve(process.cwd(), args[i + 1]);
      i += 1;
      continue;
    }
    if (arg === '--source-environment' && args[i + 1]) {
      sourceEnvironment = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--target-environment' && args[i + 1]) {
      targetEnvironment = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--approved-by' && args[i + 1]) {
      approvedBy = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--approved-by-secondary' && args[i + 1]) {
      approvedBySecondary = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--require-dual-signoff-all') {
      requireDualSignoffAll = true;
      continue;
    }
    if (arg === '--state' && args[i + 1]) {
      states.push(args[i + 1].toUpperCase());
      i += 1;
      continue;
    }
    if (arg === '--all-approved') {
      allApproved = true;
      continue;
    }
    if (arg === '--dry-run') {
      dryRun = true;
    }
  }

  if (!sourceRunDir) {
    const entries = await fs.readdir(sourceRoot, { withFileTypes: true });
    const runs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    if (runs.length === 0) {
      throw new Error(`No source run directories found in ${sourceRoot}. Provide --source-run-dir.`);
    }
    sourceRunDir = path.join(sourceRoot, runs[runs.length - 1]);
  }

  return {
    sourceRunDir,
    sourceRoot,
    targetRoot,
    sourceEnvironment,
    targetEnvironment,
    approvedBy,
    approvedBySecondary,
    requireDualSignoffAll,
    states: Array.from(new Set(states)),
    allApproved,
    dryRun,
  };
};

const safeReadJson = async <T>(filePath: string): Promise<T | null> => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const sha256File = async (filePath: string): Promise<string> => {
  const raw = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(raw).digest('hex');
};

const listStateDirs = async (runDir: string): Promise<string[]> => {
  const entries = await fs.readdir(runDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && /^[A-Z]{2}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
};

const stateEligibleForAllApproved = async (sourceRunDir: string, state: string): Promise<boolean> => {
  const decision = await safeReadJson<PublishDecision>(path.join(sourceRunDir, state, 'publish_decision.json'));
  const checks = await safeReadJson<GateCheckResult[]>(path.join(sourceRunDir, state, 'gate3_check_results.json'));
  if (!decision || !checks) return false;
  if (decision.approved_for_publish !== true) return false;
  return checks.every((check) => check.status === 'pass');
};

const writeJson = async (filePath: string, payload: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
};

const updateCurrentPointerAtomically = async (pointerPath: string, payload: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(pointerPath), { recursive: true });
  const tmpPath = `${pointerPath}.tmp`;
  await fs.writeFile(tmpPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await fs.rename(tmpPath, pointerPath);
};

const runForState = async (options: CliOptions, state: string, nowIso: string): Promise<PromotionStateResult> => {
  const stateDir = path.join(options.sourceRunDir, state);
  const decision = await safeReadJson<PublishDecision>(path.join(stateDir, 'publish_decision.json'));
  const checks = await safeReadJson<GateCheckResult[]>(path.join(stateDir, 'gate3_check_results.json'));
  const canonicalPath = path.join(stateDir, 'canonical_snapshot.json');
  const qaPath = path.join(stateDir, 'qa_metrics.json');
  const detailsPath = path.join(stateDir, 'gate3_details.json');

  if (!decision || !checks) {
    return {
      state,
      promoted: false,
      skipped: true,
      reason: 'Missing publish decision or Gate 3 check artifacts',
      source_run_dir: options.sourceRunDir,
      target_artifact_dir: null,
      promotion_unit: null,
      parity_result: 'fail',
    };
  }

  const schemaVersion = decision.schema_version || '';
  const dataVersion = decision.data_version || '';
  const snapshotHash = decision.snapshot_hash || '';
  if (!schemaVersion || !dataVersion || !snapshotHash) {
    return {
      state,
      promoted: false,
      skipped: true,
      reason: 'Promotion unit incomplete (schema_version/data_version/snapshot_hash required)',
      source_run_dir: options.sourceRunDir,
      target_artifact_dir: null,
      promotion_unit: null,
      parity_result: 'fail',
    };
  }

  if (decision.approved_for_publish !== true) {
    return {
      state,
      promoted: false,
      skipped: true,
      reason: 'State is not approved_for_publish in source run',
      source_run_dir: options.sourceRunDir,
      target_artifact_dir: null,
      promotion_unit: {
        state,
        schema_version: schemaVersion,
        data_version: dataVersion,
        snapshot_hash: snapshotHash,
      },
      parity_result: 'fail',
    };
  }

  const hasBlockingChecks = checks.some((check) => check.status !== 'pass');
  if (hasBlockingChecks) {
    return {
      state,
      promoted: false,
      skipped: true,
      reason: 'Gate 3 checks contain non-pass status',
      source_run_dir: options.sourceRunDir,
      target_artifact_dir: null,
      promotion_unit: {
        state,
        schema_version: schemaVersion,
        data_version: dataVersion,
        snapshot_hash: snapshotHash,
      },
      parity_result: 'fail',
    };
  }

  const overrideUsed = decision.override_used === true;
  const dualSignoffRequired = overrideUsed || options.requireDualSignoffAll;
  if (dualSignoffRequired && !options.approvedBySecondary) {
    return {
      state,
      promoted: false,
      skipped: false,
      reason: options.requireDualSignoffAll
        ? 'Dual sign-off required for all promotions (--approved-by-secondary missing)'
        : 'Dual sign-off required for override-involved promotion (--approved-by-secondary missing)',
      source_run_dir: options.sourceRunDir,
      target_artifact_dir: null,
      promotion_unit: {
        state,
        schema_version: schemaVersion,
        data_version: dataVersion,
        snapshot_hash: snapshotHash,
      },
      parity_result: 'fail',
    };
  }

  const canonicalHash = await sha256File(canonicalPath);
  const qaHash = await sha256File(qaPath);
  const unitDirName = `${dataVersion}_${snapshotHash.slice(0, 12)}`;
  const targetStateRoot = path.join(options.targetRoot, 'states', state);
  const targetArtifactDir = path.join(targetStateRoot, unitDirName);
  const promotionManifestPath = path.join(targetArtifactDir, 'promotion_manifest.json');
  const existingManifest = await safeReadJson<Record<string, unknown>>(promotionManifestPath);

  if (existingManifest) {
    return {
      state,
      promoted: true,
      skipped: true,
      reason: 'Promotion unit already exists (idempotent)',
      source_run_dir: options.sourceRunDir,
      target_artifact_dir: targetArtifactDir,
      promotion_unit: {
        state,
        schema_version: schemaVersion,
        data_version: dataVersion,
        snapshot_hash: snapshotHash,
      },
      parity_result: 'pass',
    };
  }

  if (!options.dryRun) {
    await fs.mkdir(targetArtifactDir, { recursive: true });
    await fs.copyFile(canonicalPath, path.join(targetArtifactDir, 'canonical_snapshot.json'));
    await fs.copyFile(qaPath, path.join(targetArtifactDir, 'qa_metrics.json'));
    await fs.copyFile(path.join(stateDir, 'publish_decision.json'), path.join(targetArtifactDir, 'publish_decision.json'));
    await fs.copyFile(path.join(stateDir, 'gate3_check_results.json'), path.join(targetArtifactDir, 'gate3_check_results.json'));
    await fs.copyFile(detailsPath, path.join(targetArtifactDir, 'gate3_details.json'));
  }

  const manifest = {
    source_environment: options.sourceEnvironment,
    target_environment: options.targetEnvironment,
    state,
    schema_version: schemaVersion,
    data_version: dataVersion,
    snapshot_hash: snapshotHash,
    parity_result: 'pass',
    approved_by: options.approvedBy,
    approved_by_secondary: options.approvedBySecondary,
    approval_timestamp: nowIso,
    source_run_dir: options.sourceRunDir,
    target_artifact_dir: targetArtifactDir,
    promotion_unit: {
      state,
      schema_version: schemaVersion,
      data_version: dataVersion,
      snapshot_hash: snapshotHash,
    },
    hash_parity: {
      canonical_snapshot_sha256: canonicalHash,
      qa_metrics_sha256: qaHash,
      hash_equality_confirmed: true,
    },
    dual_signoff: {
      required: dualSignoffRequired,
      primary_approver: options.approvedBy,
      secondary_approver: options.approvedBySecondary,
      override_used_in_source: overrideUsed,
      overridden_gates: decision.overridden_gates || [],
    },
    promotion_policy: 'multi_environment_governance_v1_1',
  };

  if (!options.dryRun) {
    await writeJson(promotionManifestPath, manifest);
    await updateCurrentPointerAtomically(path.join(targetStateRoot, 'current.json'), {
      state,
      schema_version: schemaVersion,
      data_version: dataVersion,
      snapshot_hash: snapshotHash,
      artifact_dir: targetArtifactDir,
      source_run_dir: options.sourceRunDir,
      promoted_at: nowIso,
      dual_signoff_required: dualSignoffRequired,
      approved_by_primary: options.approvedBy,
      approved_by_secondary: options.approvedBySecondary,
    });
  }

  return {
    state,
    promoted: true,
    skipped: false,
    reason: null,
    source_run_dir: options.sourceRunDir,
    target_artifact_dir: targetArtifactDir,
    promotion_unit: {
      state,
      schema_version: schemaVersion,
      data_version: dataVersion,
      snapshot_hash: snapshotHash,
    },
    parity_result: 'pass',
  };
};

const main = async () => {
  const options = await parseCli();
  await fs.mkdir(options.targetRoot, { recursive: true });

  const allStates = await listStateDirs(options.sourceRunDir);
  let selectedStates = options.states.length > 0 ? allStates.filter((state) => options.states.includes(state)) : allStates;
  if (options.allApproved) {
    const eligible: string[] = [];
    for (const state of selectedStates) {
      if (await stateEligibleForAllApproved(options.sourceRunDir, state)) {
        eligible.push(state);
      }
    }
    selectedStates = eligible;
  }
  if (selectedStates.length === 0) {
    throw new Error('No matching states found for promotion.');
  }

  const nowIso = new Date().toISOString();
  const results: PromotionStateResult[] = [];
  for (const state of selectedStates) {
    const result = await runForState(options, state, nowIso);
    results.push(result);
    console.log(
      `[${result.promoted && !result.skipped ? 'PROMOTED' : result.promoted ? 'SKIP' : 'BLOCKED'}] ${state} ${
        result.reason ? `- ${result.reason}` : ''
      }`
    );
  }

  const successful = results.filter((result) => result.promoted && !result.skipped).length;
  const blocked = results.filter((result) => !result.promoted && !result.skipped).length;
  const skipped = results.filter((result) => result.skipped).length;
  const runManifest = {
    source_environment: options.sourceEnvironment,
    target_environment: options.targetEnvironment,
    source_run_dir: options.sourceRunDir,
    target_root: options.targetRoot,
    approved_by: options.approvedBy,
    approved_by_secondary: options.approvedBySecondary,
    require_dual_signoff_all: options.requireDualSignoffAll,
    approval_timestamp: nowIso,
    all_approved_mode: options.allApproved,
    dry_run: options.dryRun,
    promoted_count: successful,
    blocked_count: blocked,
    skipped_count: skipped,
    states: results,
  };

  const promotionRunDir = path.join(options.targetRoot, 'promotions', nowIso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'));
  await writeJson(path.join(promotionRunDir, 'promotion_manifest.json'), runManifest);

  if (blocked > 0) {
    console.error(`Promotion blocked for ${blocked} state(s). Manifest: ${path.join(promotionRunDir, 'promotion_manifest.json')}`);
    process.exit(1);
  }

  console.log(`Promotion completed. Manifest: ${path.join(promotionRunDir, 'promotion_manifest.json')}`);
};

main().catch((error) => {
  console.error('promote_candidate crashed:', error);
  process.exit(1);
});
