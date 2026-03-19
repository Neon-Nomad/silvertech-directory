import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('facility trust signals contract', () => {
  it('renders license context on canonical city facility cards', () => {
    const cityTemplate = read('astro-src/pages/[care]/[state]/[city]/index.astro');

    expect(cityTemplate).toContain('{facility.licenseNumber && <span class="sl-city-pill sl-city-pill--trust">Licensed</span>}');
    expect(cityTemplate).toContain('{facility.licenseNumber && <span>License {facility.licenseNumber}</span>}');
    expect(cityTemplate).toContain('{facility.cmsCertificationNumber && <span>CMS {facility.cmsCertificationNumber}</span>}');
  });

  it('keeps trust signals visible in Astro listing cards', () => {
    const cityTemplate = read('astro-src/pages/[care]/[state]/[city]/index.astro');

    expect(cityTemplate).toContain('Medicare-linked');
    expect(cityTemplate).toContain('Official website listed');
    expect(cityTemplate).toContain('Profile data updating');
  });
});
