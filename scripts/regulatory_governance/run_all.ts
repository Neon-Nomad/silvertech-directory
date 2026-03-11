import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

type CliOptions = {
  outputRoot: string;
  dataVersion: string;
  baselineRunDir: string | null;
};

type GateRunResult = {
  gate: 'gate1' | 'gate2' | 'gate3';
  exitCode: number;
  summaryPath: string;
};

const parseCli = (): CliOptions => {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    outputRoot: path.resolve(process.cwd(), 'artifacts', 'regulatory-governance-dev'),
    dataVersion: `${new Date().toISOString().slice(0, 10)}.v1`,
    baselineRunDir: null,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--output-root' && args[i + 1]) {
      options.outputRoot = path.resolve(process.cwd(), args[i + 1]);
      i += 1;
      continue;
    }
    if (arg === '--data-version' && args[i + 1]) {
      options.dataVersion = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--baseline-run-dir' && args[i + 1]) {
      options.baselineRunDir = path.resolve(process.cwd(), args[i + 1]);
      i += 1;
    }
  }

  return options;
};

const listRunDirs = async (root: string): Promise<string[]> => {
  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
};

const runCommand = async (command: string, args: string[]): Promise<number> =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', () => resolve(1));
  });

const resolveCurrentRunDir = async (outputRoot: string, beforeRuns: string[]): Promise<string> => {
  const afterRuns = await listRunDirs(outputRoot);
  const newRuns = afterRuns.filter((run) => !beforeRuns.includes(run));
  const selected = newRuns.length > 0 ? newRuns[newRuns.length - 1] : afterRuns[afterRuns.length - 1];
  if (!selected) {
    throw new Error(`Unable to determine run directory under ${outputRoot}`);
  }
  return path.join(outputRoot, selected);
};

const resolveBaselineRunDir = async (
  outputRoot: string,
  currentRunDir: string,
  explicitBaseline: string | null
): Promise<string | null> => {
  if (explicitBaseline) return explicitBaseline;
  const runs = await listRunDirs(outputRoot);
  const currentName = path.basename(currentRunDir);
  const previous = runs.filter((run) => run !== currentName);
  if (previous.length === 0) return null;
  return path.join(outputRoot, previous[previous.length - 1]);
};

const main = async () => {
  const options = parseCli();
  await fs.mkdir(options.outputRoot, { recursive: true });

  const beforeRuns = await listRunDirs(options.outputRoot);
  const gateResults: GateRunResult[] = [];

  console.log(`Running governance Gate 1 (outputRoot=${options.outputRoot}, dataVersion=${options.dataVersion})`);
  const gate1Exit = await runCommand('npx', [
    'tsx',
    'scripts/regulatory_governance/run_gate1.ts',
    '--output-root',
    options.outputRoot,
    '--data-version',
    options.dataVersion,
  ]);

  const currentRunDir = await resolveCurrentRunDir(options.outputRoot, beforeRuns);
  const baselineRunDir = await resolveBaselineRunDir(options.outputRoot, currentRunDir, options.baselineRunDir);
  const gate1SummaryPath = path.join(currentRunDir, 'run_summary.json');
  gateResults.push({ gate: 'gate1', exitCode: gate1Exit, summaryPath: gate1SummaryPath });

  console.log(
    `Running governance Gate 2 (runDir=${currentRunDir}${baselineRunDir ? `, baseline=${baselineRunDir}` : ''})`
  );
  const gate2Args = ['tsx', 'scripts/regulatory_governance/run_gate2.ts', '--run-dir', currentRunDir];
  if (baselineRunDir) {
    gate2Args.push('--baseline-run-dir', baselineRunDir);
  }
  const gate2Exit = await runCommand('npx', gate2Args);
  const gate2SummaryPath = path.join(currentRunDir, 'gate2_summary.json');
  gateResults.push({ gate: 'gate2', exitCode: gate2Exit, summaryPath: gate2SummaryPath });

  console.log(
    `Running governance Gate 3 (runDir=${currentRunDir}${baselineRunDir ? `, baseline=${baselineRunDir}` : ''})`
  );
  const gate3Args = ['tsx', 'scripts/regulatory_governance/run_gate3.ts', '--run-dir', currentRunDir];
  if (baselineRunDir) {
    gate3Args.push('--baseline-run-dir', baselineRunDir);
  }
  const gate3Exit = await runCommand('npx', gate3Args);
  const gate3SummaryPath = path.join(currentRunDir, 'gate3_summary.json');
  gateResults.push({ gate: 'gate3', exitCode: gate3Exit, summaryPath: gate3SummaryPath });

  const gate3SummaryRaw = await fs.readFile(gate3SummaryPath, 'utf8');
  const gate3Summary = JSON.parse(gate3SummaryRaw) as { failed_state_count?: number; approved_state_count?: number; state_count?: number };
  const failedStateCount = gate3Summary.failed_state_count ?? 0;

  const orchestratorSummary = {
    run_dir: currentRunDir,
    baseline_run_dir: baselineRunDir,
    data_version: options.dataVersion,
    generated_at: new Date().toISOString(),
    gates: gateResults,
    approved_state_count: gate3Summary.approved_state_count ?? null,
    failed_state_count: failedStateCount,
    state_count: gate3Summary.state_count ?? null,
  };

  const orchestratorSummaryPath = path.join(currentRunDir, 'governance_run_summary.json');
  await fs.writeFile(orchestratorSummaryPath, `${JSON.stringify(orchestratorSummary, null, 2)}\n`, 'utf8');

  if (failedStateCount > 0) {
    console.error(
      `Governance run completed with blocked states (${failedStateCount}). See ${orchestratorSummaryPath}`
    );
    process.exit(1);
  }

  console.log(`Governance run passed. Summary: ${orchestratorSummaryPath}`);
};

main().catch((error) => {
  console.error('run_all crashed:', error);
  process.exit(1);
});

