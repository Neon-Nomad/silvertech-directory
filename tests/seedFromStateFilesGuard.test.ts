import { describe, expect, it } from 'vitest';
import {
  PRODUCTION_PROJECT_REF,
  assertFacilityResetAllowed,
  resetTargetFor,
} from '../scripts/lib/facilityResetGuard';

const PRODUCTION_URL = `https://${PRODUCTION_PROJECT_REF}.supabase.co`;
const DEV_REF = 'devprojectref1';
const DEV_URL = `https://${DEV_REF}.supabase.co`;

describe('facility reset guard', () => {
  it('refuses the production project, even when the confirmation names it', () => {
    expect(() =>
      assertFacilityResetAllowed(PRODUCTION_URL, { FACILITY_RESET_CONFIRM: PRODUCTION_PROJECT_REF }),
    ).toThrow(/production Supabase project/);
  });

  it('refuses the production project when there is no confirmation', () => {
    expect(() => assertFacilityResetAllowed(PRODUCTION_URL, {})).toThrow(/production Supabase project/);
  });

  it('refuses the production project in an uppercase URL', () => {
    expect(() =>
      assertFacilityResetAllowed(`https://${PRODUCTION_PROJECT_REF.toUpperCase()}.supabase.co`, {
        FACILITY_RESET_CONFIRM: PRODUCTION_PROJECT_REF,
      }),
    ).toThrow(/production Supabase project/);
  });

  it('refuses another hosted project without confirmation', () => {
    expect(() => assertFacilityResetAllowed(DEV_URL, {})).toThrow(/set FACILITY_RESET_CONFIRM=devprojectref1/);
  });

  it('refuses another hosted project when the confirmation names a different project', () => {
    expect(() => assertFacilityResetAllowed(DEV_URL, { FACILITY_RESET_CONFIRM: 'someotherref' })).toThrow(
      /set FACILITY_RESET_CONFIRM=devprojectref1/,
    );
  });

  it('allows another hosted project when the confirmation names that project', () => {
    expect(() => assertFacilityResetAllowed(DEV_URL, { FACILITY_RESET_CONFIRM: DEV_REF })).not.toThrow();
  });

  it('allows a local Supabase instance without confirmation', () => {
    for (const url of ['http://localhost:54321', 'http://127.0.0.1:54321', 'http://[::1]:54321']) {
      expect(() => assertFacilityResetAllowed(url, {})).not.toThrow();
    }
  });

  it('refuses a host that is neither local nor a Supabase project', () => {
    expect(() => assertFacilityResetAllowed('https://example.com', { FACILITY_RESET_CONFIRM: 'example' })).toThrow(
      /neither a local host nor a Supabase project URL/,
    );
  });

  it('refuses a URL that is not a URL', () => {
    expect(() => assertFacilityResetAllowed('not a url', {})).toThrow(/not a valid URL/);
  });

  it('classifies targets', () => {
    expect(resetTargetFor('http://localhost:54321')).toEqual({ kind: 'local' });
    expect(resetTargetFor(DEV_URL)).toEqual({ kind: 'project', ref: DEV_REF });
  });
});
