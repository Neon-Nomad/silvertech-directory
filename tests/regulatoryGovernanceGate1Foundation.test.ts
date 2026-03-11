import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const packageJsonPath = path.resolve(process.cwd(), 'package.json');
const gateScriptPath = path.resolve(process.cwd(), 'scripts/regulatory_governance/run_gate1.ts');
const gate2ScriptPath = path.resolve(process.cwd(), 'scripts/regulatory_governance/run_gate2.ts');
const gate3ScriptPath = path.resolve(process.cwd(), 'scripts/regulatory_governance/run_gate3.ts');
const runAllScriptPath = path.resolve(process.cwd(), 'scripts/regulatory_governance/run_all.ts');
const promoteScriptPath = path.resolve(process.cwd(), 'scripts/regulatory_governance/promote_candidate.ts');
const contractPath = path.resolve(process.cwd(), 'scripts/regulatory_governance/contracts.ts');

describe('regulatory governance gate1 foundation', () => {
  it('ships gate runners and orchestration command', () => {
    expect(fs.existsSync(gateScriptPath)).toBe(true);
    expect(fs.existsSync(gate2ScriptPath)).toBe(true);
    expect(fs.existsSync(gate3ScriptPath)).toBe(true);
    expect(fs.existsSync(runAllScriptPath)).toBe(true);
    expect(fs.existsSync(promoteScriptPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.['governance:gate1']).toContain('scripts/regulatory_governance/run_gate1.ts');
    expect(pkg.scripts?.['governance:gate2']).toContain('scripts/regulatory_governance/run_gate2.ts');
    expect(pkg.scripts?.['governance:gate3']).toContain('scripts/regulatory_governance/run_gate3.ts');
    expect(pkg.scripts?.['governance:run']).toContain('scripts/regulatory_governance/run_all.ts');
    expect(pkg.scripts?.['governance:promote']).toContain('scripts/regulatory_governance/promote_candidate.ts');
  });

  it('defines locked check result contract fields and gate IDs', () => {
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('check_id');
    expect(source).toContain('status: CheckStatus');
    expect(source).toContain('severity: CheckSeverity');
    expect(source).toContain('metric_value: number | null');
    expect(source).toContain('threshold: number | null');
    expect(source).toContain('baseline_reference_version: string | null');
    expect(source).toContain("id: 'G1.1'");
    expect(source).toContain("id: 'G1.2'");
    expect(source).toContain("id: 'G1.3'");
    expect(source).toContain("id: 'G1.4'");
    expect(source).toContain("id: 'G1.5'");
    expect(source).toContain("id: 'G1.6'");
    expect(source).toContain("id: 'G2.1'");
    expect(source).toContain("id: 'G2.2'");
    expect(source).toContain("id: 'G2.3'");
    expect(source).toContain("id: 'G3.1'");
    expect(source).toContain("id: 'G3.2'");
    expect(source).toContain("id: 'G3.3'");
    expect(source).toContain("id: 'G3.4'");
    expect(source).toContain("id: 'G3.5'");
    expect(source).toContain("id: 'G3.6'");
    expect(source).toContain("id: 'G3.7'");
    expect(source).toContain("id: 'G3.8'");
  });
});
