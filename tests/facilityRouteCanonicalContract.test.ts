import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('facility route canonical contract', () => {
  it('keeps canonical path anchored to the current route id to prevent uuid-slug redirect loops', () => {
    const facilityDetails = read('features/family/discovery/FacilityDetails.tsx');

    expect(facilityDetails).toContain('const canonicalPath = buildFacilityDetailPath({');
    expect(facilityDetails).toContain('// Keep the active route id to avoid UUID <-> slug redirect ping-pong.');
    expect(facilityDetails).toContain('id: routeFacilityId,');
    expect(facilityDetails).not.toMatch(
      /const canonicalPath = buildFacilityDetailPath\(\{[\s\S]*id: data\.id \|\| routeFacilityId,/
    );
  });

  it('does not force noindex when a canonical slug can be derived from facility data', () => {
    const facilityDetails = read('features/family/discovery/FacilityDetails.tsx');

    expect(facilityDetails).toContain('const derivedRouteSlug = buildFacilityRouteId({');
    expect(facilityDetails).toContain('const canonicalSlug = isUuidUrl ? resolvedSlug || derivedRouteSlug : routeFacilityId;');
    expect(facilityDetails).toContain('{isUuidUrl && !canonicalSlug && <meta name="robots" content="noindex, follow" />}');
  });
});
