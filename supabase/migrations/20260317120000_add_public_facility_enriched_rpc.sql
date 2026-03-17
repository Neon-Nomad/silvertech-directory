-- Public read RPC for claimed facility enriched profile data.
-- Returns description, pricing, photos, amenities, and tour URLs for a facility.
-- Security definer bypasses RLS so public visitors can see published operator data.

create or replace function public.get_public_facility_enriched(p_facility_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'is_claimed',          (f.owner_id is not null),
    'description',         f.description,
    'min_price',           f.min_price,
    'max_price',           f.max_price,
    'virtual_tour_url',    f.virtual_tour_url,
    'tour_scheduling_url', f.tour_scheduling_url,
    'photos', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('url', fp.url, 'caption', fp.caption)
          order by fp.display_order, fp.created_at
        )
        from facility_photos fp
        where fp.facility_id = f.id
      ),
      '[]'::jsonb
    ),
    'amenities', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('name', a.name, 'category', a.category, 'icon', a.icon)
          order by a.category, a.name
        )
        from facility_amenities fa
        join amenities a on a.id = fa.amenity_id
        where fa.facility_id = f.id
      ),
      '[]'::jsonb
    )
  )
  into v_result
  from facilities f
  where f.id = p_facility_id;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

grant execute on function public.get_public_facility_enriched(uuid) to anon, authenticated;
