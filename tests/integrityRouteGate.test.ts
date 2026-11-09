import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// The developer harness must be gated by build mode only. A visitor's URL must not be able to enable it.
const source = fs.readFileSync(path.resolve(process.cwd(), 'App.tsx'), 'utf8').replace(/\r\n/g, '\n');
const gateMatch = source.match(/const enableIntegrityHarness =([\s\S]*?);/);

describe('integrity harness route gate', () => {
  it('has a build-time gate expression', () => {
    expect(gateMatch).not.toBeNull();
  });

  it('does not read the visitor URL', () => {
    expect(gateMatch?.[1] ?? '').not.toMatch(/pathname|location|window/);
  });

  it('keeps the dev, test-mode and e2e build flags', () => {
    const gate = gateMatch?.[1] ?? '';
    expect(gate).toContain('import.meta.env.DEV');
    expect(gate).toContain("import.meta.env.MODE === 'test'");
    expect(gate).toContain("import.meta.env.VITE_ENABLE_E2E_ROUTES === 'true'");
  });

  it('renders the harness route only behind the gate', () => {
    expect(source).toMatch(/\{enableIntegrityHarness && <Route path="\/__integrity"/);
  });
});
