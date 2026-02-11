drop function if exists public.search_facilities(text,text,text,text,integer,integer);

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
  phone text,
  website_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select id, name, city, state, address_line1, postal_code, phone, website_url
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
