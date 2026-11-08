// Joins directory shard records to the reviewed facility UUID map. Pure: no file or network access.
//
// A record gets database_facility_id only when the committed map has a `mapped` row for its exact canonical
// path. Duplicate, conflicting, and unmatched identities get no UUID, so the directory offers a support path
// instead of a claim. Nothing is matched on name, address, or a partial key.
import { ALL_STATES } from '../../src/data/states';
import { parse, type MapRow } from './facilityUuidMap';

export type ShardRecord = {
  id: string;
  public_slug?: string;
  public_route_id?: number;
  primary_care_type_slug?: string;
  state: string;
  city: string;
  database_facility_id?: string;
};

export type IdentityCounts = Record<'mapped' | 'unresolved' | 'no_map_row', number>;

// Same slug rules as the page routes (astro-src/lib/data.ts). Kept here so this module has no data side effects.
const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const stateSlugFor = (abbr: string) => ALL_STATES.find((s) => s.abbreviation === abbr)?.slug || toSlug(abbr);

// The canonical path the static facility page and the map builder use: care/state/city/slug-routeId.
export const shardIdentityPath = (record: ShardRecord): string | null => {
  if (!record.primary_care_type_slug || !record.public_slug || record.public_route_id == null) return null;
  const state = stateSlugFor((record.state || '').trim().toUpperCase());
  const city = toSlug(record.city || '');
  if (!state || !city) return null;
  return `${record.primary_care_type_slug}/${state}/${city}/${record.public_slug}-${record.public_route_id}`;
};

export const loadMapRows = (tsv: string): Map<string, MapRow> => new Map(parse(tsv).map((row) => [row.path, row]));

// Returns a copy of the record with database_facility_id only when its identity is mapped. Any other field is kept.
export const withDatabaseFacilityId = <T extends ShardRecord>(
  record: T,
  rows: Map<string, MapRow>,
): { record: T & { database_facility_id?: string }; status: keyof IdentityCounts } => {
  const path = shardIdentityPath(record);
  const row = path ? rows.get(path) : undefined;
  if (!row) return { record, status: 'no_map_row' };
  if (row.status === 'unresolved') return { record, status: 'unresolved' };
  return { record: { ...record, database_facility_id: row.uuid }, status: 'mapped' };
};

export const attachDatabaseFacilityIds = <T extends ShardRecord>(
  records: T[],
  rows: Map<string, MapRow>,
): { records: Array<T & { database_facility_id?: string }>; counts: IdentityCounts } => {
  const counts: IdentityCounts = { mapped: 0, unresolved: 0, no_map_row: 0 };
  const out = records.map((record) => {
    const result = withDatabaseFacilityId(record, rows);
    counts[result.status] += 1;
    return result.record;
  });
  return { records: out, counts };
};
