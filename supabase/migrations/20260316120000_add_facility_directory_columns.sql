-- Add columns needed for the Astro static build directory pages.
-- These fields come from state/CMS data sources and are used for
-- facility cards, trust signals, and stats on city/state pages.

alter table public.facilities
  add column if not exists county text,
  add column if not exists beds integer,
  add column if not exists ownership_type text,
  add column if not exists license_type text,
  add column if not exists issuing_agency text,
  add column if not exists last_verified_date date,
  add column if not exists data_source text;

create index if not exists idx_facilities_state_city
  on public.facilities (state, city);

create index if not exists idx_facilities_county
  on public.facilities (county);

comment on column public.facilities.county is 'County name from CMS/state source data';
comment on column public.facilities.beds is 'Licensed bed capacity';
comment on column public.facilities.ownership_type is 'Raw ownership type string from source data (e.g. "For profit - Corporation")';
comment on column public.facilities.license_type is 'License type from state licensing authority';
comment on column public.facilities.issuing_agency is 'State agency that issued the license';
comment on column public.facilities.last_verified_date is 'Date the facility record was last verified against source data';
comment on column public.facilities.data_source is 'JSON metadata describing the source dataset';
