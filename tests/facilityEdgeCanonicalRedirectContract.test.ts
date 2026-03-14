import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('facility edge canonical redirect contract', () => {
  it('redirects uuid-based /senior-living facility URLs to slug canonical paths', () => {
    const edgeFn = read('netlify/edge-functions/facility-metadata.ts');

    expect(edgeFn).toContain('if (UUID_REGEX.test(facilityPathId) && facilityRecord)');
    expect(edgeFn).toContain('const routeId = buildFacilityRouteId(facilityPathId, facilityRecord, slugEntry);');
    expect(edgeFn).toContain('return Response.redirect(redirectUrl.toString(), 301);');
  });
});

