drop function if exists public.search_facilities(text,text,text,text,integer,integer);
create extension if not exists pg_trgm;

create index if not exists facilities_name_trgm_idx
  on public.facilities using gin (name gin_trgm_ops);

create index if not exists facilities_city_trgm_idx
  on public.facilities using gin (city gin_trgm_ops);

create index if not exists facilities_state_idx
  on public.facilities (state);

create index if not exists facilities_postal_code_idx
  on public.facilities (postal_code);

create or replace function public.search_facilities(
  query_text text,
  state_filter text,
  city_filter text,
  postal_filter text,
  limit_count integer,
  offset_count integer
)
returns table (
  id uuid,
  name text,
  city text,
  state text,
  address_line1 text,
  postal_code text,
  phone text
)
language sql
stable
security definer
set search_path = public
as $$
  select id, name, city, state, address_line1, postal_code, phone
  from public.facilities
  where
    (state_filter is null or state = state_filter)
    and (postal_filter is null or postal_code = postal_filter)
    and (city_filter is null or city ilike city_filter)
    and (query_text is null or name ilike '%' || query_text || '%')
  order by name
  limit limit_count
  offset offset_count;
$$;

grant execute on function public.search_facilities(text,text,text,text,integer,integer) to anon, authenticated;
notify pgrst, 'reload schema';
