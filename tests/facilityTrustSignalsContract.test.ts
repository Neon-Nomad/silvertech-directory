import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('facility trust signals contract', () => {
  it('renders license context on canonical city facility cards', () => {
    const cityTemplate = read('astro-src/pages/[care]/[state]/[city]/index.astro');

    expect(cityTemplate).toContain("License: {facility.licenseNumber || 'Pending'}");
    expect(cityTemplate).toContain('Care Type: {careType.label}');
  });

  it('keeps medicare and licensing status visible in the community detail header', () => {
    const facilityDetails = read('features/family/discovery/FacilityDetails.tsx');

    expect(facilityDetails).toContain("Verified Community | Medicare: {medicareCertified ? 'Certified' : 'Not listed'}");
    expect(facilityDetails).toContain('State License Number');
    expect(facilityDetails).toContain('Primary Care Type');
  });
});
