-- Add credential fields required for facility import and badge derivation.

alter table public.facilities
  add column if not exists state_license_number text;

alter table public.facilities
  add column if not exists cms_certification_number text;

create index if not exists idx_facilities_state_license_number
  on public.facilities (state_license_number);

create index if not exists idx_facilities_cms_certification_number
  on public.facilities (cms_certification_number);

-- Natural-key lookup index used by bulk CSV import matching:
-- name + street + city + state
create index if not exists idx_facilities_natural_key_lookup
  on public.facilities (state, city, address_line1, name);
