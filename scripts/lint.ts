import { spawnSync } from 'node:child_process';

type LintCheck = {
  label: string;
  args: string[];
};

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const needsShell = process.platform === 'win32';

const checks: LintCheck[] = [
  {
    label: 'App TypeScript',
    args: ['tsc', '--noEmit', '--pretty', 'false', '--noUnusedLocals', '--noUnusedParameters'],
  },
  {
    label: 'Astro Data TypeScript',
    args: [
      'tsc',
      '--noEmit',
      '--pretty',
      'false',
      'astro-src/lib/seniorLivingData.ts',
      '--target',
      'ES2022',
      '--module',
      'ESNext',
      '--moduleResolution',
      'bundler',
      '--lib',
      'ES2022,DOM',
      '--skipLibCheck',
      '--allowJs',
    ],
  },
];

for (const check of checks) {
  console.log(`\n[lint] ${check.label}`);
  const result = spawnSync(npxCommand, check.args, {
    stdio: 'inherit',
    shell: needsShell,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\n[lint] All checks passed');
