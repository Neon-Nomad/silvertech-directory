import dotenv from 'dotenv';
import { spawnSync } from 'node:child_process';

dotenv.config();

type Step = {
  name: string;
  script: string;
  required: boolean;
};

type StepResult = {
  name: string;
  script: string;
  required: boolean;
  success: boolean;
  durationSeconds: number;
  detail: string;
};

const args = new Set(process.argv.slice(2));
const isDryRun = args.has('--dry-run') || process.env.FOUNDER_DAILY_DRY_RUN === 'true';

const WEBHOOK_URL = process.env.FOUNDER_DAILY_WEBHOOK_URL || process.env.ALERT_WEBHOOK_URL || '';
const RUN_PHASE6_GATE = process.env.FOUNDER_DAILY_RUN_PHASE6_GATE === 'true';

const REQUIRED_STEPS: Step[] = [
  { name: 'Retry dead letters', script: 'pipeline:retry', required: true },
  { name: 'Normalize raw events', script: 'pipeline:normalize', required: true },
  { name: 'Refresh read models', script: 'pipeline:refresh-models', required: true },
  { name: 'Pipeline health monitor', script: 'pipeline:monitor', required: true },
];

const OPTIONAL_STEPS: Step[] = RUN_PHASE6_GATE
  ? [{ name: 'Phase 6 monitor', script: 'monitor:phase6', required: false }]
  : [];

const runNpmScript = (script: string) => {
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return spawnSync(command, ['run', script], {
    stdio: 'inherit',
    env: process.env,
  });
};

const runStep = (step: Step): StepResult => {
  const started = Date.now();
  if (isDryRun) {
    return {
      name: step.name,
      script: step.script,
      required: step.required,
      success: true,
      durationSeconds: 0,
      detail: 'dry-run',
    };
  }

  const result = runNpmScript(step.script);
  const status = result.status ?? 1;
  const durationSeconds = Math.max(0, Math.round((Date.now() - started) / 1000));

  return {
    name: step.name,
    script: step.script,
    required: step.required,
    success: status === 0,
    durationSeconds,
    detail: result.error ? String(result.error) : `exit=${status}`,
  };
};

const buildSummary = (results: StepResult[], startedAtIso: string, endedAtIso: string) => {
  const failedRequired = results.filter((r) => !r.success && r.required);
  const failedOptional = results.filter((r) => !r.success && !r.required);
  const passed = results.filter((r) => r.success);
  const overall = failedRequired.length === 0 ? 'PASS' : 'FAIL';

  const lines: string[] = [
    `SilverTech Founder Daily Run: ${overall}`,
    `Started: ${startedAtIso}`,
    `Ended: ${endedAtIso}`,
    `Passed: ${passed.length}/${results.length}`,
  ];

  if (failedRequired.length > 0) {
    lines.push(`Required failures: ${failedRequired.length}`);
  }

  if (failedOptional.length > 0) {
    lines.push(`Optional failures: ${failedOptional.length}`);
  }

  lines.push('Step Results:');
  for (const result of results) {
    const icon = result.success ? 'OK' : result.required ? 'ERR' : 'WARN';
    lines.push(
      `- [${icon}] ${result.name} (${result.script}) ${result.durationSeconds}s ${result.detail}`
    );
  }

  return {
    overall,
    text: lines.join('\n'),
    hasRequiredFailure: failedRequired.length > 0,
  };
};

const sendSummary = async (summaryText: string) => {
  if (!WEBHOOK_URL) return;
  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: summaryText,
      app: 'silvertech-directory',
      scope: 'founder-daily',
      timestamp: new Date().toISOString(),
    }),
  });
};

const main = async () => {
  const startedAtIso = new Date().toISOString();
  const allSteps = [...REQUIRED_STEPS, ...OPTIONAL_STEPS];

  console.log(`Founder daily run started (${isDryRun ? 'dry-run' : 'live'})`);
  const results: StepResult[] = [];

  for (const step of allSteps) {
    console.log(`\nRunning: ${step.name} [${step.script}]`);
    const result = runStep(step);
    results.push(result);
    if (!result.success && result.required) {
      console.error(`Stopping run due to required step failure: ${step.script}`);
      break;
    }
  }

  const endedAtIso = new Date().toISOString();
  const summary = buildSummary(results, startedAtIso, endedAtIso);
  console.log(`\n${summary.text}`);

  try {
    await sendSummary(summary.text);
  } catch (err) {
    console.error(`Failed to send founder daily webhook: ${String(err)}`);
    if (summary.hasRequiredFailure) {
      process.exit(1);
    }
  }

  if (summary.hasRequiredFailure) {
    process.exit(1);
  }
};

main().catch(async (err) => {
  const message = `SilverTech Founder Daily Run crashed: ${String(err)}`;
  console.error(message);
  try {
    await sendSummary(message);
  } catch {
    // no-op
  }
  process.exit(1);
});
