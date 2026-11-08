import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.hoisted(() => vi.fn());

vi.mock('@/src/lib/supabase', () => ({
  supabase: { rpc },
}));

import {
  fetchReviewedFacilityIds,
  isFacilityUuid,
  reviewedDatabaseIdFor,
  withReviewedDatabaseIds,
} from '@/src/utils/facilityIdentity';

const MAPPED = 'dd27d2dd-58fe-4cf5-add0-5e186beba37a';
const DUPLICATE = '3250d542-2b72-4caf-bb6a-ce15fd1420cb';

describe('isFacilityUuid', () => {
  it('accepts database UUIDs and rejects public slug-style IDs', () => {
    expect(isFacilityUuid(MAPPED)).toBe(true);
    expect(isFacilityUuid('guardian-angels-care-center-6874')).toBe(false);
    expect(isFacilityUuid('')).toBe(false);
    expect(isFacilityUuid(null)).toBe(false);
  });
});

describe('reviewedDatabaseIdFor: fails closed', () => {
  const reviewed = new Set([MAPPED]);

  it('uses the mapped shard UUID when it is reviewed', () => {
    expect(reviewedDatabaseIdFor({ id: 'slug-1', database_facility_id: MAPPED }, reviewed)).toBe(MAPPED);
  });

  it('uses a database row ID from search results only when it is reviewed', () => {
    expect(reviewedDatabaseIdFor({ id: MAPPED }, reviewed)).toBe(MAPPED);
    expect(reviewedDatabaseIdFor({ id: DUPLICATE }, reviewed)).toBeNull();
  });

  it('returns null for a slug-style ID with no mapped UUID', () => {
    expect(reviewedDatabaseIdFor({ id: 'guardian-angels-care-center-6874' }, reviewed)).toBeNull();
  });

  it('returns null when a mapped-looking UUID is not in the reviewed set', () => {
    expect(reviewedDatabaseIdFor({ id: 'slug-1', database_facility_id: DUPLICATE }, reviewed)).toBeNull();
  });
});

describe('fetchReviewedFacilityIds', () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it('asks the database only about UUIDs, and returns only UUIDs', async () => {
    rpc.mockResolvedValue({ data: [MAPPED, 'not-a-uuid'], error: null });
    const result = await fetchReviewedFacilityIds([MAPPED, 'slug-only', MAPPED]);
    expect(rpc).toHaveBeenCalledWith('reviewed_facility_ids', { p_facility_ids: [MAPPED] });
    expect([...result]).toEqual([MAPPED]);
  });

  it('makes no call when there is nothing to check', async () => {
    const result = await fetchReviewedFacilityIds(['slug-only']);
    expect(rpc).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });

  it('treats a failed check as nothing reviewed', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'Could not find the function' } });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await fetchReviewedFacilityIds([MAPPED]);
    expect(result.size).toBe(0);
    warn.mockRestore();
  });
});

describe('withReviewedDatabaseIds', () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ data: [MAPPED], error: null });
  });

  it('keeps reviewed UUIDs and gives every other result null', async () => {
    const out = await withReviewedDatabaseIds([
      { id: MAPPED, name: 'Reviewed' },
      { id: DUPLICATE, name: 'Duplicate' },
      { id: 'slug-only', name: 'Unmapped', database_facility_id: undefined },
    ]);
    expect(out.map((r) => r.database_facility_id)).toEqual([MAPPED, null, null]);
    expect(out.map((r) => r.name)).toEqual(['Reviewed', 'Duplicate', 'Unmapped']);
  });
});
