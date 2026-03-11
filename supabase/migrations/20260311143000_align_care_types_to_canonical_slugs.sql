-- Align care_types taxonomy to the canonical senior-living slug contract.
-- Canonical slugs:
-- assisted-living, memory-care, nursing-homes, independent-living,
-- residential-care, adult-day-services, ccrc

alter table public.care_types
  add column if not exists slug text;

-- Map known existing names to canonical slugs.
update public.care_types
set slug = 'assisted-living'
where lower(trim(name)) = 'assisted living';

update public.care_types
set slug = 'memory-care'
where lower(trim(name)) = 'memory care';

update public.care_types
set slug = 'nursing-homes'
where lower(trim(name)) in ('skilled nursing', 'nursing home', 'nursing homes');

update public.care_types
set slug = 'independent-living'
where lower(trim(name)) = 'independent living';

-- Fill remaining missing slugs with normalized name slugs (temporary).
update public.care_types
set slug = lower(regexp_replace(trim(name), '[^a-z0-9]+', '-', 'g'))
where slug is null or trim(slug) = '';

-- Remove non-canonical care type links before canonical enforcement.
delete from public.facility_care_types fct
using public.care_types ct
where ct.id = fct.care_type_id
  and ct.slug not in (
    'assisted-living',
    'memory-care',
    'nursing-homes',
    'independent-living',
    'residential-care',
    'adult-day-services',
    'ccrc'
  );

delete from public.care_types
where slug not in (
  'assisted-living',
  'memory-care',
  'nursing-homes',
  'independent-living',
  'residential-care',
  'adult-day-services',
  'ccrc'
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'care_types_slug_key'
  ) then
    alter table public.care_types
      add constraint care_types_slug_key unique (slug);
  end if;
end $$;

-- Upsert the canonical taxonomy rows.
insert into public.care_types (name, slug, description)
values
  ('Assisted Living', 'assisted-living', 'Help with daily activities like bathing and dressing.'),
  ('Memory Care', 'memory-care', 'Specialized care for Alzheimer''s and dementia.'),
  ('Nursing Home', 'nursing-homes', '24-hour medical care and rehabilitation.'),
  ('Independent Living', 'independent-living', 'Active senior living with minimal assistance.'),
  ('Residential Care Home', 'residential-care', 'Small-home setting with personal care support.'),
  ('Adult Day Services', 'adult-day-services', 'Structured daytime care and supervision.'),
  ('CCRC / Life Plan Community', 'ccrc', 'Continuum-of-care community with multiple service levels.')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description;

alter table public.care_types
  alter column slug set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'care_types_slug_canonical_chk'
  ) then
    alter table public.care_types
      add constraint care_types_slug_canonical_chk check (
        slug in (
          'assisted-living',
          'memory-care',
          'nursing-homes',
          'independent-living',
          'residential-care',
          'adult-day-services',
          'ccrc'
        )
      );
  end if;
end $$;
