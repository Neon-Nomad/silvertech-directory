import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('facility route canonical contract', () => {
  it('resolves facility pages from the slug-id community route', () => {
    const facilityDetails = read('features/family/discovery/FacilityDetails.tsx');

    expect(facilityDetails).toContain('const parsedCommunityId = useMemo(() => parseCommunityId(communityId), [communityId]);');
    expect(facilityDetails).toContain(".eq('public_route_id', parsedCommunityId.publicRouteId)");
    expect(facilityDetails).toContain('const canonicalUrl = buildFacilityCanonicalUrl({');
  });

  it('returns a not-found state for malformed or mismatched community paths instead of self-healing', () => {
    const facilityDetails = read('features/family/discovery/FacilityDetails.tsx');

    expect(facilityDetails).toContain("setError('Invalid community path.')");
    expect(facilityDetails).toContain("throw new Error('Community slug mismatch');");
    expect(facilityDetails).not.toContain('window.location.replace');
  });
});
