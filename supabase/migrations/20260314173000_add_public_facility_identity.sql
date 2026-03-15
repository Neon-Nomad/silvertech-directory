create sequence if not exists public.facilities_public_route_id_seq as bigint;

alter table public.facilities
  add column if not exists public_route_id bigint,
  add column if not exists public_slug text,
  add column if not exists primary_care_type_slug text;

alter sequence public.facilities_public_route_id_seq owned by public.facilities.public_route_id;

alter table public.facilities
  alter column public_route_id set default nextval('public.facilities_public_route_id_seq');

update public.facilities
set public_route_id = nextval('public.facilities_public_route_id_seq')
where public_route_id is null;

select setval(
  'public.facilities_public_route_id_seq',
  greatest(coalesce((select max(public_route_id) from public.facilities), 1), 1),
  true
);

update public.facilities
set public_slug = trim(both '-' from regexp_replace(lower(coalesce(name, 'facility')), '[^a-z0-9]+', '-', 'g'))
where coalesce(public_slug, '') = '';

with ranked_care_types as (
  select
    fct.facility_id,
    ct.slug,
    row_number() over (
      partition by fct.facility_id
      order by case ct.slug
        when 'assisted-living' then 1
        when 'memory-care' then 2
        when 'nursing-homes' then 3
        when 'independent-living' then 4
        when 'residential-care' then 5
        when 'adult-day-services' then 6
        when 'ccrc' then 7
        else 99
      end,
      ct.slug
    ) as rank_order
  from public.facility_care_types fct
  join public.care_types ct
    on ct.id = fct.care_type_id
)
update public.facilities f
set primary_care_type_slug = ranked.slug
from ranked_care_types ranked
where ranked.facility_id = f.id
  and ranked.rank_order = 1
  and coalesce(f.primary_care_type_slug, '') = '';

update public.facilities
set primary_care_type_slug = 'assisted-living'
where coalesce(primary_care_type_slug, '') = '';

alter table public.facilities
  alter column public_route_id set not null,
  alter column public_slug set not null,
  alter column primary_care_type_slug set not null;

create unique index if not exists idx_facilities_public_route_id
  on public.facilities (public_route_id);

create unique index if not exists idx_facilities_public_slug_route
  on public.facilities (public_slug, public_route_id);

create index if not exists idx_facilities_primary_care_type_slug
  on public.facilities (primary_care_type_slug);

notify pgrst, 'reload schema';
