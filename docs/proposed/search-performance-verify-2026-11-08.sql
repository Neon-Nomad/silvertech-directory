-- Compares search_facilities with search_facilities_before on random real filter combinations.
-- Before running: create search_facilities_before from supabase/migrations/20260314174000_update_search_facilities_public_identity.sql with the function renamed. Run on a copy, never directly on production.
-- Expected: full_set_mismatch = 0 and top50_name_mismatch = 0.
create or replace function pg_temp.compare_searches(samples int) returns table (checked int, full_set_mismatch int, top50_name_mismatch int, examples text)
language plpgsql as $$
declare
  r record; v_q text; v_s text; v_c text; v_z text; v_args text;
  a uuid[]; b uuid[]; na text[]; nb text[];
  v_checked int := 0; v_full int := 0; v_top int := 0; v_ex text := '';
begin
  for r in select f.name, f.state, f.city, f.postal_code from public.facilities f order by random() limit samples loop
    for v_args in select unnest(array[
        format('null,%L,null,null', r.state),
        format('null,%L,%L,null', r.state, '%' || lower(r.city) || '%'),
        format('null,null,null,%L', r.postal_code),
        format('%L,null,null,null', substr(r.name, 1, 4)),
        format('%L,%L,null,null', substr(r.name, 1, 5), r.state),
        format('null,null,%L,null', '%' || lower(r.city) || '%')
      ]) loop
      execute format('select array_agg(id order by id), array_agg(name order by name) from (select * from public.search_facilities_before(%s, 100000, 0)) x', v_args) into a, na;
      execute format('select array_agg(id order by id), array_agg(name order by name) from (select * from public.search_facilities(%s, 100000, 0)) x', v_args) into b, nb;
      v_checked := v_checked + 1;
      if a is distinct from b then
        v_full := v_full + 1;
        if length(v_ex) < 600 then v_ex := v_ex || ' | ' || v_args; end if;
      end if;
      execute format('select array_agg(name order by name) from (select name from public.search_facilities_before(%s, 50, 0)) x', v_args) into na;
      execute format('select array_agg(name order by name) from (select name from public.search_facilities(%s, 50, 0)) x', v_args) into nb;
      if na is distinct from nb then v_top := v_top + 1; end if;
    end loop;
  end loop;
  return query select v_checked, v_full, v_top, v_ex;
end $$;
set role anon;
select * from pg_temp.compare_searches(60);
