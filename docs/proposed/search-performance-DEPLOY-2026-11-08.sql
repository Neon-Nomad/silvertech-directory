-- Faster directory search. Same results, same signature, same columns.
--
-- Why: search_facilities deduplicated every matching facility before it sorted and limited the result.
-- A broad search (one letter, a state, or a nationwide city) sorted tens of thousands of rows and spilled
-- to disk, which took 0.2 to 0.6 seconds locally and can exceed the 3-second limit on the anonymous role.
--
-- What changes: the function looks at the first few matching rows in name order, and checks each one for a
-- better duplicate with an index lookup. If too few rows survive, it looks at a larger window. A duplicate
-- check is cheap, so the work now scales with the page size, not the number of matches.
--
-- Rules kept: a duplicate group is defined by the same normalized name, address, city, state, and postal
-- code as before. Within a group, the row with the lowest public_route_id (nulls last), then the lowest id,
-- is kept. Results are ordered by name, then id.
--
-- Deployment: this is a database change. Apply it on its own, outside a frontend release, through the
-- Supabase SQL editor or a reviewed migration. Do not run `supabase db push` for it: that also applies the
-- pending March migration. The index build takes a short lock on facilities (about a second on 91k rows).
-- It is safe to run more than once.
--
-- Verified locally on a copy of the 91,121 production-sized rows, against the previous function:
--   360 random filter combinations and 30 duplicate-heavy name searches with page two: 0 mismatches.

begin;

-- Safety check. Stops before any change if the function has more than one overload, or if the
-- tables it reads are missing. Written against the function in migration 20260314174000.
do $$
declare
  v_overloads integer;
begin
  select count(*) into v_overloads
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'search_facilities';
  if v_overloads > 1 then
    raise exception 'search_facilities has % overloads; stop and review before applying', v_overloads;
  end if;
  if to_regclass('public.facilities') is null
     or to_regclass('public.facility_questions') is null
     or to_regclass('public.facility_answers') is null then
    raise exception 'facilities, facility_questions, or facility_answers is missing; stop and review';
  end if;
end $$;


create or replace function public.facility_dedupe_key(
  p_name text,
  p_address text,
  p_city text,
  p_state text,
  p_postal text
)
returns text[]
language sql
immutable
parallel safe
as $$
  select array[
    lower(regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g')),
    lower(regexp_replace(trim(coalesce(p_address, '')), '\s+', ' ', 'g')),
    lower(regexp_replace(trim(coalesce(p_city, '')), '\s+', ' ', 'g')),
    upper(trim(coalesce(p_state, ''))),
    trim(coalesce(p_postal, ''))
  ]
$$;

-- Lets the duplicate check find other rows with the same key without scanning facilities.
create index if not exists facilities_dedupe_key_idx
  on public.facilities (public.facility_dedupe_key(name, address_line1, city, state, postal_code));

-- The return shape must not change, so drop and recreate in this transaction.
drop function if exists public.search_facilities(text, text, text, text, integer, integer);

create function public.search_facilities(
  query_text text,
  state_filter text,
  city_filter text,
  postal_filter text,
  limit_count integer,
  offset_count integer
)
returns table (
  id uuid,
  public_slug text,
  public_route_id bigint,
  primary_care_type_slug text,
  name text,
  city text,
  state text,
  address_line1 text,
  postal_code text,
  phone text,
  website_url text,
  owner_id uuid,
  listing_tier text,
  waiting_question_count integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(coalesce(limit_count, 50), 1);
  v_offset integer := greatest(coalesce(offset_count, 0), 0);
  v_need integer := greatest(coalesce(limit_count, 50), 1) + greatest(coalesce(offset_count, 0), 0);
  v_window integer;
  v_total integer;
  v_kept integer;
begin
  v_window := greatest(v_need * 2, 100);
  loop
    -- The first v_window matching rows in name order. Only these are examined.
    select count(*), count(*) filter (where ok) into v_total, v_kept
    from (
      select c.id, not exists (
        select 1 from public.facilities g
        where public.facility_dedupe_key(g.name, g.address_line1, g.city, g.state, g.postal_code)
            = public.facility_dedupe_key(c.name, c.address_line1, c.city, c.state, c.postal_code)
          and g.id <> c.id
          and (state_filter is null or g.state = state_filter)
          and (postal_filter is null or g.postal_code = postal_filter)
          and (city_filter is null or g.city ilike city_filter)
          and (query_text is null or g.name ilike '%' || query_text || '%')
          and (coalesce(g.public_route_id, 9223372036854775807), g.id)
            < (coalesce(c.public_route_id, 9223372036854775807), c.id)
      ) as ok
      from (
        select f.id, f.name, f.address_line1, f.city, f.state, f.postal_code, f.public_route_id
        from public.facilities f
        where (state_filter is null or f.state = state_filter)
          and (postal_filter is null or f.postal_code = postal_filter)
          and (city_filter is null or f.city ilike city_filter)
          and (query_text is null or f.name ilike '%' || query_text || '%')
        order by f.name, f.id
        limit v_window
      ) c
    ) s;

    -- Stop when enough rows were kept, or when every matching row was examined.
    exit when v_kept >= v_need or v_total < v_window;
    v_window := v_window * 4;
  end loop;

  return query
  with cand as (
    select f.id, f.name, f.address_line1, f.city, f.state, f.postal_code, f.public_route_id
    from public.facilities f
    where (state_filter is null or f.state = state_filter)
      and (postal_filter is null or f.postal_code = postal_filter)
      and (city_filter is null or f.city ilike city_filter)
      and (query_text is null or f.name ilike '%' || query_text || '%')
    order by f.name, f.id
    limit v_window
  ),
  kept as (
    select c.id, c.name, row_number() over (order by c.name, c.id) as rn
    from cand c
    where not exists (
      select 1 from public.facilities g
      where public.facility_dedupe_key(g.name, g.address_line1, g.city, g.state, g.postal_code)
          = public.facility_dedupe_key(c.name, c.address_line1, c.city, c.state, c.postal_code)
        and g.id <> c.id
        and (state_filter is null or g.state = state_filter)
        and (postal_filter is null or g.postal_code = postal_filter)
        and (city_filter is null or g.city ilike city_filter)
        and (query_text is null or g.name ilike '%' || query_text || '%')
        and (coalesce(g.public_route_id, 9223372036854775807), g.id)
          < (coalesce(c.public_route_id, 9223372036854775807), c.id)
    )
  )
  select f.id, f.public_slug, f.public_route_id, f.primary_care_type_slug, f.name, f.city, f.state, f.address_line1,
    f.postal_code, f.phone, f.website_url, f.owner_id, f.listing_tier,
    coalesce((
      select count(*)
      from public.facility_questions fq
      where fq.facility_id = f.id
        and fq.status = 'approved'
        and not exists (
          select 1 from public.facility_answers fa
          where fa.question_id = fq.id and fa.status = 'approved' and fa.is_operator = true
        )
    ), 0)::integer
  from kept k
  join public.facilities f on f.id = k.id
  where k.rn > v_offset and k.rn <= v_offset + v_limit
  order by k.rn;
end
$$;

revoke execute on function public.facility_dedupe_key(text, text, text, text, text) from public, anon, authenticated;

grant execute on function public.search_facilities(text, text, text, text, integer, integer) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
