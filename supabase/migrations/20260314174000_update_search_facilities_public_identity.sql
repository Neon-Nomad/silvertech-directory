do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'search_facilities'
  loop
    execute format('drop function if exists %s', fn);
  end loop;
end
$$;

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
language sql
stable
security definer
set search_path = public
as $$
  with filtered as (
    select
      f.id,
      f.public_slug,
      f.public_route_id,
      f.primary_care_type_slug,
      f.name,
      f.city,
      f.state,
      f.address_line1,
      f.postal_code,
      f.phone,
      f.website_url,
      f.owner_id,
      f.listing_tier,
      lower(regexp_replace(trim(coalesce(f.name, '')), '\s+', ' ', 'g')) as dedupe_name,
      lower(regexp_replace(trim(coalesce(f.address_line1, '')), '\s+', ' ', 'g')) as dedupe_address,
      lower(regexp_replace(trim(coalesce(f.city, '')), '\s+', ' ', 'g')) as dedupe_city,
      upper(trim(coalesce(f.state, ''))) as dedupe_state,
      trim(coalesce(f.postal_code, '')) as dedupe_postal
    from public.facilities f
    where
      (state_filter is null or f.state = state_filter)
      and (postal_filter is null or f.postal_code = postal_filter)
      and (city_filter is null or f.city ilike city_filter)
      and (query_text is null or f.name ilike '%' || query_text || '%')
  ),
  ranked as (
    select
      filtered.*,
      row_number() over (
        partition by dedupe_name, dedupe_address, dedupe_city, dedupe_state, dedupe_postal
        order by public_route_id nulls last, id
      ) as dedupe_rank
    from filtered
  ),
  deduped as (
    select *
    from ranked
    where dedupe_rank = 1
  )
  select
    d.id,
    d.public_slug,
    d.public_route_id,
    d.primary_care_type_slug,
    d.name,
    d.city,
    d.state,
    d.address_line1,
    d.postal_code,
    d.phone,
    d.website_url,
    d.owner_id,
    d.listing_tier,
    coalesce((
      select count(*)
      from public.facility_questions fq
      where fq.facility_id = d.id
        and fq.status = 'approved'
        and not exists (
          select 1
          from public.facility_answers fa
          where fa.question_id = fq.id
            and fa.status = 'approved'
            and fa.is_operator = true
        )
    ), 0)::integer as waiting_question_count
  from deduped d
  order by d.name
  limit greatest(coalesce(limit_count, 50), 1)
  offset greatest(coalesce(offset_count, 0), 0);
$$;

grant execute on function public.search_facilities(text, text, text, text, integer, integer) to anon, authenticated;
notify pgrst, 'reload schema';
