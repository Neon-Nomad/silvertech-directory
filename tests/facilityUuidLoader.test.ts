import { describe, expect, it } from 'vitest';
import { getFacilityUuid, missingRowCount } from '../astro-src/lib/facilityUuidMap';

// Runs against the committed map (vitest runs from the repository root).
describe('build-time facility UUID loader', () => {
  it('returns the UUID for a mapped identity', () => {
    expect(getFacilityUuid('assisted-living/minnesota/minneapolis/hope-wellness-center-inc-1127636603')).toBe('f67a0c7c-7c29-4e06-8346-59e492080864');
  });

  it('returns null for an unresolved identity, never a guess', () => {
    expect(getFacilityUuid('nursing-homes/alabama/altoona/altoona-health-rehab-41')).toBeNull();
  });

  it('returns null, and does not throw, for an identity with no map row', () => {
    const before = missingRowCount();
    expect(getFacilityUuid('assisted-living/nowhere/nowhere/not-a-real-facility-0')).toBeNull();
    expect(missingRowCount()).toBe(before + 1);
  });
});
