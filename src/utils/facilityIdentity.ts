import { supabase } from '@/src/lib/supabase';

// Same pattern the family and claim flows have always used for database facility IDs.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isFacilityUuid = (value?: string | null): value is string => Boolean(value && UUID_PATTERN.test(value));

// Asks the database which of these IDs are reviewed, unique identities (facility_claim_eligibility).
// Fails closed: if the check cannot run, no facility is treated as reviewed, so no claim or save is offered.
export const fetchReviewedFacilityIds = async (ids: string[]): Promise<Set<string>> => {
  const unique = Array.from(new Set(ids.filter(isFacilityUuid)));
  if (unique.length === 0) return new Set();
  try {
    const { data, error } = await supabase.rpc('reviewed_facility_ids', { p_facility_ids: unique });
    if (error) throw error;
    return new Set(((data as string[] | null) ?? []).filter(isFacilityUuid));
  } catch (error) {
    console.warn('Reviewed facility identities are unavailable; claim and save are withheld.', error);
    return new Set();
  }
};

// The database ID a result may be claimed or saved under, or null. The mapped ID from the shard wins over the
// result's own ID. Either way the ID must be a reviewed identity; anything else returns null.
export const reviewedDatabaseIdFor = (
  facility: { id: string; database_facility_id?: string | null },
  reviewed: Set<string>,
): string | null => {
  const candidate = facility.database_facility_id || facility.id;
  return isFacilityUuid(candidate) && reviewed.has(candidate) ? candidate : null;
};

// Attaches `database_facility_id` only to results that are reviewed identities. Every other result gets null.
export const withReviewedDatabaseIds = async <T extends { id: string; database_facility_id?: string | null }>(
  results: T[],
): Promise<Array<T & { database_facility_id: string | null }>> => {
  const reviewed = await fetchReviewedFacilityIds(results.map((r) => r.database_facility_id || r.id));
  return results.map((result) => ({ ...result, database_facility_id: reviewedDatabaseIdFor(result, reviewed) }));
};
