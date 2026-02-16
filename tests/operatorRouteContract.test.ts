import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('operator auth route contract', () => {
  it('registers /operator/signup route in app router', () => {
    const appSource = readFileSync(resolve(process.cwd(), 'App.tsx'), 'utf8');
    expect(appSource).toContain('<Route path="/operator/signup" element={<OperatorSignUp />} />');
  });
});
