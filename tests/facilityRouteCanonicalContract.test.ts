import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('facility route canonical contract', () => {
  it('keeps canonical path anchored to the current route id to prevent uuid-slug redirect loops', () => {
    const facilityDetails = read('features/family/discovery/FacilityDetails.tsx');

    expect(facilityDetails).toContain('id: routeFacilityId,');
    expect(facilityDetails).not.toContain('id: data.id || routeFacilityId,');
  });
});
