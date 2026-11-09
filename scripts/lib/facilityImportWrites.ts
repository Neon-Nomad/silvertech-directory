// Writes one facility import to the database.
//
// A row is written only when the import would change a stored value. Re-running an unchanged CSV therefore leaves
// every existing row version untouched. Without these guards, each run rewrote every matched facility and its
// licensing row, which created dead row versions and index churn. The COALESCE rules are unchanged: an empty or
// missing incoming value keeps the stored value.

export type ImportFacility = {
  naturalKey: string;
  name: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  bedCapacity: number | null;
  stateLicenseNumber: string | null;
  cmsCertificationNumber: string | null;
  issuingAgency: string | null;
};

// The subset of a pg client this module needs. A pg Client satisfies it.
export type SqlClient = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number | null }>;
};

export type FacilityImportWriteResult = {
  matchedExisting: number;
  updatedRows: number;
  unchangedMatches: number;
  insertedRows: number;
  licensingUpserts: number;
};

export const writeFacilityImport = async (
  client: SqlClient,
  facilities: ImportFacility[],
  batchSize: number,
): Promise<FacilityImportWriteResult> => {
  await client.query(`
    create temporary table tmp_facility_import (
      natural_key text primary key,
      name text not null,
      address_line1 text not null,
      city text not null,
      state text not null,
      postal_code text,
      latitude double precision,
      longitude double precision,
      phone text,
      email text,
      bed_capacity integer,
      state_license_number text,
      cms_certification_number text,
      issuing_agency text
    );
  `);

  for (let i = 0; i < facilities.length; i += batchSize) {
    const chunk = facilities.slice(i, i + batchSize);

    await client.query(
      `
        insert into tmp_facility_import (
          natural_key,
          name,
          address_line1,
          city,
          state,
          postal_code,
          latitude,
          longitude,
          phone,
          email,
          bed_capacity,
          state_license_number,
          cms_certification_number,
          issuing_agency
        )
        select *
        from unnest(
          $1::text[],
          $2::text[],
          $3::text[],
          $4::text[],
          $5::text[],
          $6::text[],
          $7::double precision[],
          $8::double precision[],
          $9::text[],
          $10::text[],
          $11::integer[],
          $12::text[],
          $13::text[],
          $14::text[]
        )
        on conflict (natural_key) do update
        set
          postal_code = coalesce(excluded.postal_code, tmp_facility_import.postal_code),
          latitude = coalesce(excluded.latitude, tmp_facility_import.latitude),
          longitude = coalesce(excluded.longitude, tmp_facility_import.longitude),
          phone = coalesce(excluded.phone, tmp_facility_import.phone),
          email = coalesce(excluded.email, tmp_facility_import.email),
          bed_capacity = coalesce(excluded.bed_capacity, tmp_facility_import.bed_capacity),
          state_license_number = coalesce(excluded.state_license_number, tmp_facility_import.state_license_number),
          cms_certification_number = coalesce(excluded.cms_certification_number, tmp_facility_import.cms_certification_number),
          issuing_agency = coalesce(excluded.issuing_agency, tmp_facility_import.issuing_agency);
      `,
      [
        chunk.map((r) => r.naturalKey),
        chunk.map((r) => r.name),
        chunk.map((r) => r.addressLine1),
        chunk.map((r) => r.city),
        chunk.map((r) => r.state),
        chunk.map((r) => r.postalCode),
        chunk.map((r) => r.latitude),
        chunk.map((r) => r.longitude),
        chunk.map((r) => r.phone),
        chunk.map((r) => r.email),
        chunk.map((r) => r.bedCapacity),
        chunk.map((r) => r.stateLicenseNumber),
        chunk.map((r) => r.cmsCertificationNumber),
        chunk.map((r) => r.issuingAgency),
      ],
    );
  }

  await client.query(`
    create temporary table tmp_existing_facility_keys
    as
    select distinct on (natural_key)
      natural_key,
      id as facility_id
    from (
      select
        f.id,
        concat_ws(
          '|',
          regexp_replace(regexp_replace(lower(trim(coalesce(f.name, ''))), '[^a-z0-9 ]+', '', 'g'), '\\s+', ' ', 'g'),
          regexp_replace(regexp_replace(lower(trim(coalesce(f.address_line1, ''))), '[^a-z0-9 ]+', '', 'g'), '\\s+', ' ', 'g'),
          regexp_replace(regexp_replace(lower(trim(coalesce(f.city, ''))), '[^a-z0-9 ]+', '', 'g'), '\\s+', ' ', 'g'),
          upper(trim(coalesce(f.state, '')))
        ) as natural_key,
        f.created_at
      from public.facilities f
    ) keys
    order by natural_key, created_at asc, facility_id asc;
  `);
  await client.query(`create index on tmp_existing_facility_keys (natural_key);`);

  const matchedRes = await client.query(`
    select count(*)::text as count
    from tmp_facility_import t
    join tmp_existing_facility_keys k on k.natural_key = t.natural_key;
  `);
  const matchedExisting = Number((matchedRes.rows[0] as { count?: string } | undefined)?.count || 0);

  // Only rows whose stored values would change are written. The comparison is null-safe, so a NULL stored value
  // that the import fills in counts as a change, and an unchanged value does not.
  const updateRes = await client.query(`
    update public.facilities f
    set
      postal_code = coalesce(nullif(t.postal_code, ''), f.postal_code),
      latitude = coalesce(t.latitude, f.latitude),
      longitude = coalesce(t.longitude, f.longitude),
      phone = coalesce(nullif(t.phone, ''), f.phone),
      email = coalesce(nullif(t.email, ''), f.email),
      state_license_number = coalesce(nullif(t.state_license_number, ''), f.state_license_number),
      cms_certification_number = coalesce(
        nullif(t.cms_certification_number, ''),
        f.cms_certification_number
      ),
      updated_at = now()
    from tmp_facility_import t
    join tmp_existing_facility_keys k on k.natural_key = t.natural_key
    where f.id = k.facility_id
      and (f.postal_code, f.latitude, f.longitude, f.phone, f.email, f.state_license_number, f.cms_certification_number)
        is distinct from (
          coalesce(nullif(t.postal_code, ''), f.postal_code),
          coalesce(t.latitude, f.latitude),
          coalesce(t.longitude, f.longitude),
          coalesce(nullif(t.phone, ''), f.phone),
          coalesce(nullif(t.email, ''), f.email),
          coalesce(nullif(t.state_license_number, ''), f.state_license_number),
          coalesce(nullif(t.cms_certification_number, ''), f.cms_certification_number)
        );
  `);

  const insertRes = await client.query(`
    insert into public.facilities (
      name,
      address_line1,
      city,
      state,
      postal_code,
      latitude,
      longitude,
      phone,
      email,
      state_license_number,
      cms_certification_number
    )
    select
      t.name,
      t.address_line1,
      t.city,
      t.state,
      nullif(t.postal_code, ''),
      t.latitude,
      t.longitude,
      nullif(t.phone, ''),
      nullif(t.email, ''),
      nullif(t.state_license_number, ''),
      nullif(t.cms_certification_number, '')
    from tmp_facility_import t
    left join tmp_existing_facility_keys k on k.natural_key = t.natural_key
    where k.facility_id is null;
  `);

  // Licensing rows are written only when the license number, bed capacity, or authority would change.
  const licensingRes = await client.query(`
    with deduped as (
      select distinct on (license_number)
        facility_id,
        license_number,
        bed_capacity,
        authority
      from (
        select
          f.id as facility_id,
          nullif(t.state_license_number, '') as license_number,
          t.bed_capacity,
          nullif(t.issuing_agency, '') as authority
        from tmp_facility_import t
        join public.facilities f
          on concat_ws(
            '|',
            regexp_replace(regexp_replace(lower(trim(coalesce(f.name, ''))), '[^a-z0-9 ]+', '', 'g'), '\\s+', ' ', 'g'),
            regexp_replace(regexp_replace(lower(trim(coalesce(f.address_line1, ''))), '[^a-z0-9 ]+', '', 'g'), '\\s+', ' ', 'g'),
            regexp_replace(regexp_replace(lower(trim(coalesce(f.city, ''))), '[^a-z0-9 ]+', '', 'g'), '\\s+', ' ', 'g'),
            upper(trim(coalesce(f.state, '')))
          ) = t.natural_key
        where nullif(t.state_license_number, '') is not null
      ) src
      order by license_number, facility_id
    )
    insert into public.facility_licensing (
      facility_id,
      license_number,
      bed_capacity,
      authority,
      updated_at
    )
    select
      facility_id,
      license_number,
      bed_capacity,
      authority,
      now()
    from deduped
    on conflict (license_number) do update
    set
      facility_id = excluded.facility_id,
      bed_capacity = coalesce(excluded.bed_capacity, public.facility_licensing.bed_capacity),
      authority = coalesce(excluded.authority, public.facility_licensing.authority),
      updated_at = now()
    where (public.facility_licensing.facility_id, public.facility_licensing.bed_capacity, public.facility_licensing.authority)
      is distinct from (
        excluded.facility_id,
        coalesce(excluded.bed_capacity, public.facility_licensing.bed_capacity),
        coalesce(excluded.authority, public.facility_licensing.authority)
      );
  `);

  const updatedRows = updateRes.rowCount || 0;
  return {
    matchedExisting,
    updatedRows,
    unchangedMatches: matchedExisting - updatedRows,
    insertedRows: insertRes.rowCount || 0,
    licensingUpserts: licensingRes.rowCount || 0,
  };
};
