import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('facility trust signals contract', () => {
  it('renders license and medicare details on city facility cards', () => {
    const cityTemplate = read('astro-src/pages/senior-living/[state]/[city]/index.astro');

    expect(cityTemplate).toContain("License: {facility.licenseNumber || 'Pending'}");
    expect(cityTemplate).toContain("Medicare: {isFacilityMedicareCertified(facility) ? 'Certified' : 'Not listed'}");
  });

  it('renders license and medicare details on care-type facility cards', () => {
    const careTemplate = read('astro-src/pages/senior-living/[state]/[city]/[care]/index.astro');

    expect(careTemplate).toContain("License: {facility.licenseNumber || 'Pending'}");
    expect(careTemplate).toContain("Medicare: {isFacilityMedicareCertified(facility) ? 'Certified' : 'Not listed'}");
  });

  it('keeps medicare status visible in the facility detail credential panel', () => {
    const facilityDetails = read('features/family/discovery/FacilityDetails.tsx');

    expect(facilityDetails).toContain('Medicare: {medicareCertificationLabel}');
    expect(facilityDetails).toContain('Medicare Status');
    expect(facilityDetails).toContain('Medicare Provider ID (CMS)');
  });
});
