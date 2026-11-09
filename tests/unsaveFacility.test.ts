// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'user-1' as string | null,
  deleteCalls: [] as Array<[string, unknown]>,
  deleteError: null as null | { message: string },
  from: vi.fn(),
}));

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: async () => ({
        data: { user: mocks.userId ? { id: mocks.userId } : null },
        error: null,
      }),
    },
    from: (table: string) => {
      mocks.from(table);
      return {
        delete: () => {
          mocks.deleteCalls.push(['delete', table]);
          const chain = {
            eq: (column: string, value: unknown) => {
              mocks.deleteCalls.push([column, value]);
              return {
                eq: (column2: string, value2: unknown) => {
                  mocks.deleteCalls.push([column2, value2]);
                  return Promise.resolve({ error: mocks.deleteError });
                },
              };
            },
          };
          return chain;
        },
      };
    },
  },
}));

import { unsaveFacilityForCurrentUser } from '@/src/features/family/journey/client';

const FACILITY_ID = '11111111-2222-4333-8444-555555555555';

describe('unsaveFacilityForCurrentUser', () => {
  beforeEach(() => {
    mocks.userId = 'user-1';
    mocks.deleteCalls.length = 0;
    mocks.deleteError = null;
    mocks.from.mockClear();
    localStorage.clear();
  });

  it('deletes only this signed-in family account\'s save for this facility', async () => {
    const result = await unsaveFacilityForCurrentUser(FACILITY_ID);

    expect(result).toEqual({ status: 'success' });
    expect(mocks.from).toHaveBeenCalledWith('saved_facilities');
    expect(mocks.deleteCalls).toEqual([
      ['delete', 'saved_facilities'],
      ['user_id', 'user-1'],
      ['facility_id', FACILITY_ID],
    ]);
  });

  it('succeeds without touching the database when nobody is signed in', async () => {
    mocks.userId = null;

    const result = await unsaveFacilityForCurrentUser(FACILITY_ID);

    expect(result).toEqual({ status: 'success' });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('refuses an ID that is not a database UUID, without a request', async () => {
    const result = await unsaveFacilityForCurrentUser('not-a-uuid');

    expect(result.status).toBe('error');
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('reports a database error to the caller so the control can restore its state', async () => {
    mocks.deleteError = { message: 'permission denied' };

    await expect(unsaveFacilityForCurrentUser(FACILITY_ID)).rejects.toEqual({ message: 'permission denied' });
  });
});
