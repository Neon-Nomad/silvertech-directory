import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { attachDatabaseFacilityIds, loadMapRows, shardIdentityPath, withDatabaseFacilityId } from '../scripts/lib/facilityClaimIdentity';

const MAP_TSV = fs.readFileSync(path.resolve(process.cwd(), 'data/facility-uuid-map.tsv'), 'utf8');
const rows = loadMapRows(MAP_TSV);

const guardian = {
  id: 'guardian-angels-care-center-6874',
  public_slug: 'guardian-angels-care-center',
  public_route_id: 6874,
  primary_care_type_slug: 'nursing-homes',
  state: 'MN',
  city: 'ELK RIVER',
};

describe('shardIdentityPath: the same canonical path the page and the map use', () => {
  it('builds care/state/city/slug-routeId from a shard record', () => {
    expect(shardIdentityPath(guardian)).toBe('nursing-homes/minnesota/elk-river/guardian-angels-care-center-6874');
  });

  it('returns null when a field needed for the path is missing', () => {
    expect(shardIdentityPath({ ...guardian, public_route_id: undefined })).toBeNull();
    expect(shardIdentityPath({ ...guardian, city: '' })).toBeNull();
  });
});

describe('withDatabaseFacilityId: only a mapped, unique identity gets a UUID', () => {
  it('attaches the mapped UUID to a uniquely mapped identity', () => {
    const { record, status } = withDatabaseFacilityId(guardian, rows);
    expect(status).toBe('mapped');
    expect(record.database_facility_id).toBe('ae61f7f5-8c34-4424-b539-acac9e8ef6bf');
  });

  it('attaches nothing to a duplicate-row identity, even though the map knows it', () => {
    const duplicate = {
      id: 'eastview-rehabilitation-healthcare-center-4',
      public_slug: 'eastview-rehabilitation-healthcare-center',
      public_route_id: 4,
      primary_care_type_slug: 'nursing-homes',
      state: 'AL',
      city: 'Birmingham',
    };
    const { record, status } = withDatabaseFacilityId(duplicate, rows);
    expect(status).toBe('unresolved');
    expect(record).not.toHaveProperty('database_facility_id');
  });

  it('attaches nothing to an identity with no map row', () => {
    const missing = { ...guardian, id: 'nobody-here-999999', public_slug: 'nobody-here', public_route_id: 999999 };
    const { record, status } = withDatabaseFacilityId(missing, rows);
    expect(status).toBe('no_map_row');
    expect(record).not.toHaveProperty('database_facility_id');
  });

  it('never matches on name or city alone: the same slug in another city gets no UUID', () => {
    const otherCity = { ...guardian, city: 'Blaine' };
    const { status } = withDatabaseFacilityId(otherCity, rows);
    expect(status).toBe('no_map_row');
  });

  it('keeps every other field of the record unchanged', () => {
    const { record } = withDatabaseFacilityId(guardian, rows);
    const { database_facility_id: _ignored, ...rest } = record;
    expect(rest).toEqual(guardian);
  });
});

describe('attachDatabaseFacilityIds: counts', () => {
  it('counts each status once per record', () => {
    const { records, counts } = attachDatabaseFacilityIds([guardian, { ...guardian, city: 'Blaine' }], rows);
    expect(records).toHaveLength(2);
    expect(counts).toEqual({ mapped: 1, unresolved: 0, no_map_row: 1 });
  });
});

describe('committed shards agree with the committed map', () => {
  const shardsDir = path.resolve(process.cwd(), 'public/facilities_index_shards');
  const shardFiles = fs.readdirSync(shardsDir).filter((f) => /^[A-Z]{2}\.json$/.test(f));

  it('every shard UUID is the mapped UUID for that record\'s canonical path, and nothing else is annotated', () => {
    let annotated = 0;
    const problems: string[] = [];
    for (const file of shardFiles) {
      const items = JSON.parse(fs.readFileSync(path.join(shardsDir, file), 'utf8')) as Array<Record<string, any>>;
      for (const item of items) {
        if (item.database_facility_id === undefined) continue;
        annotated += 1;
        const row = rows.get(shardIdentityPath(item) ?? '');
        if (!row || row.status !== 'mapped' || row.uuid !== item.database_facility_id) {
          problems.push(`${file}:${item.id}`);
        }
      }
    }
    expect(problems.slice(0, 5)).toEqual([]);
    expect(annotated).toBeGreaterThan(13000);
  });

  it('no unresolved or unmatched record carries a UUID', () => {
    let leaked = 0;
    for (const file of shardFiles) {
      const items = JSON.parse(fs.readFileSync(path.join(shardsDir, file), 'utf8')) as Array<Record<string, any>>;
      for (const item of items) {
        const row = rows.get(shardIdentityPath(item) ?? '');
        if ((!row || row.status !== 'mapped') && item.database_facility_id !== undefined) leaked += 1;
      }
    }
    expect(leaked).toBe(0);
  });
});
