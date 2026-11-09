// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { beforeEach, describe, expect, it } from 'vitest';
import { type ImportFacility, type SqlClient, writeFacilityImport } from '../scripts/lib/facilityImportWrites';

// Runs the import writer against a real Postgres engine (PGlite). The assertions check row versions (xmin) and
// updated_at, so a write that changes nothing visible but still rewrites a row fails the test.

const SCHEMA = `
  create table public.facilities (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    address_line1 text,
    city text,
    state text,
    postal_code text,
    latitude double precision,
    longitude double precision,
    phone text,
    email text,
    state_license_number text,
    cms_certification_number text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
  create table public.facility_licensing (
    id uuid primary key default gen_random_uuid(),
    facility_id uuid references public.facilities(id) on delete cascade,
    license_number text unique,
    bed_capacity integer,
    authority text,
    updated_at timestamptz default now()
  );
`;

// Test data uses plain lowercase letters, digits, and spaces, so the JavaScript key and the SQL key agree.
const naturalKey = (name: string, address: string, city: string, state: string) =>
  `${name.toLowerCase()}|${address.toLowerCase()}|${city.toLowerCase()}|${state.toUpperCase()}`;

const facility = (
  fields: Pick<ImportFacility, 'name' | 'addressLine1' | 'city' | 'state'> & Partial<ImportFacility>,
): ImportFacility => ({
  naturalKey: naturalKey(fields.name, fields.addressLine1, fields.city, fields.state),
  postalCode: null,
  latitude: null,
  longitude: null,
  phone: null,
  email: null,
  bedCapacity: null,
  stateLicenseNumber: null,
  cmsCertificationNumber: null,
  issuingAgency: null,
  ...fields,
});

const SUNRISE = { name: 'Sunrise Care', addressLine1: '100 Main St', city: 'Springfield', state: 'IL' };
const LAKEVIEW = { name: 'Lakeview Home', addressLine1: '22 Oak Ave', city: 'Springfield', state: 'IL' };

let db: PGlite;
let client: SqlClient;

const adapter = (pg: PGlite): SqlClient => ({
  query: async (text, values) => {
    const result = await pg.query<Record<string, unknown>>(text, values as unknown[] | undefined);
    return { rows: result.rows, rowCount: result.affectedRows ?? result.rows.length };
  },
});

// The script runs one import per connection, and the writer creates its temporary tables without "if exists". PGlite is
// a single connection, so each simulated run clears the previous run's temporary tables first.
const importOnce = async (facilities: ImportFacility[]) => {
  await db.exec('drop table if exists pg_temp.tmp_facility_import; drop table if exists pg_temp.tmp_existing_facility_keys;');
  return writeFacilityImport(client, facilities, 3000);
};

// Row version and timestamp for every facility, keyed by name. xmin changes whenever Postgres writes a row.
const facilityVersions = async () => {
  const res = await db.query<{ name: string; xmin: string; updated_at: string }>(
    'select name, xmin::text as xmin, updated_at::text as updated_at from public.facilities order by name',
  );
  return Object.fromEntries(res.rows.map((r) => [r.name, { xmin: r.xmin, updated_at: r.updated_at }]));
};

const licensingVersions = async () => {
  const res = await db.query<{ license_number: string; xmin: string }>(
    'select license_number, xmin::text as xmin from public.facility_licensing order by license_number',
  );
  return Object.fromEntries(res.rows.map((r) => [r.license_number, r.xmin]));
};

const facilityByName = async (name: string) => {
  const res = await db.query<Record<string, unknown>>(
    'select * from public.facilities where name = $1',
    [name],
  );
  return res.rows[0];
};

beforeEach(async () => {
  db = new PGlite();
  await db.exec(SCHEMA);
  client = adapter(db);
});

describe('facility import writes only rows whose stored values change', () => {
  it('a first import inserts every facility and writes no existing row', async () => {
    const result = await importOnce([
      facility({ ...SUNRISE, phone: '555-0100', stateLicenseNumber: 'LIC-1', bedCapacity: 40 }),
      facility({ ...LAKEVIEW, postalCode: '62701' }),
    ]);

    expect(result.insertedRows).toBe(2);
    expect(result.updatedRows).toBe(0);
    expect(result.matchedExisting).toBe(0);
    expect(result.licensingUpserts).toBe(1);
  });

  it('re-running an unchanged import writes no facility row and no licensing row', async () => {
    const csv = [
      facility({ ...SUNRISE, postalCode: '62701', phone: '555-0100', stateLicenseNumber: 'LIC-1', bedCapacity: 40 }),
      facility({ ...LAKEVIEW, email: 'info@lakeview.example' }),
    ];
    await importOnce(csv);
    const facilitiesBefore = await facilityVersions();
    const licensingBefore = await licensingVersions();

    const rerun = await importOnce(csv);

    expect(rerun.matchedExisting).toBe(2);
    expect(rerun.updatedRows).toBe(0);
    expect(rerun.unchangedMatches).toBe(2);
    expect(rerun.insertedRows).toBe(0);
    expect(rerun.licensingUpserts).toBe(0);
    expect(await facilityVersions()).toEqual(facilitiesBefore);
    expect(await licensingVersions()).toEqual(licensingBefore);
  });

  it('a changed value updates only the facility that changed', async () => {
    await importOnce([
      facility({ ...SUNRISE, phone: '555-0100' }),
      facility({ ...LAKEVIEW, phone: '555-0200' }),
    ]);
    const before = await facilityVersions();

    const result = await importOnce([
      facility({ ...SUNRISE, phone: '555-0199' }),
      facility({ ...LAKEVIEW, phone: '555-0200' }),
    ]);

    expect(result.updatedRows).toBe(1);
    expect(result.unchangedMatches).toBe(1);
    const after = await facilityVersions();
    expect(after['Sunrise Care'].xmin).not.toBe(before['Sunrise Care'].xmin);
    expect(after['Sunrise Care'].updated_at).not.toBe(before['Sunrise Care'].updated_at);
    expect(after['Lakeview Home']).toEqual(before['Lakeview Home']);
    expect((await facilityByName('Sunrise Care'))?.phone).toBe('555-0199');
  });

  it('an empty or missing incoming value keeps the stored value and writes nothing', async () => {
    await importOnce([facility({ ...SUNRISE, postalCode: '62701', phone: '555-0100', latitude: 39.8 })]);
    const before = await facilityVersions();

    const result = await importOnce([
      facility({ ...SUNRISE, postalCode: '', phone: null, latitude: null }),
    ]);

    expect(result.updatedRows).toBe(0);
    expect(await facilityVersions()).toEqual(before);
    const row = await facilityByName('Sunrise Care');
    expect(row?.postal_code).toBe('62701');
    expect(row?.phone).toBe('555-0100');
    expect(row?.latitude).toBe(39.8);
  });

  it('a stored NULL is filled by a non-empty incoming value, and that is a real change', async () => {
    await importOnce([facility({ ...SUNRISE })]);
    const before = await facilityVersions();

    const filled = await importOnce([facility({ ...SUNRISE, email: 'hello@sunrise.example' })]);

    expect(filled.updatedRows).toBe(1);
    expect((await facilityByName('Sunrise Care'))?.email).toBe('hello@sunrise.example');
    expect((await facilityVersions())['Sunrise Care'].xmin).not.toBe(before['Sunrise Care'].xmin);

    const again = await importOnce([facility({ ...SUNRISE, email: 'hello@sunrise.example' })]);
    expect(again.updatedRows).toBe(0);
  });

  it('licensing rows are written only when bed capacity changes', async () => {
    const withBeds = (beds: number) => [facility({ ...SUNRISE, stateLicenseNumber: 'LIC-1', bedCapacity: beds })];
    await importOnce(withBeds(40));
    const licensingBefore = await licensingVersions();

    const unchanged = await importOnce(withBeds(40));
    expect(unchanged.licensingUpserts).toBe(0);
    expect(await licensingVersions()).toEqual(licensingBefore);

    const changed = await importOnce(withBeds(52));
    expect(changed.licensingUpserts).toBe(1);
    expect((await licensingVersions())['LIC-1']).not.toBe(licensingBefore['LIC-1']);
    const row = await db.query<{ bed_capacity: number }>(
      "select bed_capacity from public.facility_licensing where license_number = 'LIC-1'",
    );
    expect(row.rows[0].bed_capacity).toBe(52);
  });
});
