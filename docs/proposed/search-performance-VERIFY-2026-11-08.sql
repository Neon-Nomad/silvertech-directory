-- READ-ONLY verification for search-performance-DEPLOY-2026-11-08.sql.
-- Safe to run before and after deployment. It changes nothing.
-- Part 1: structure. Expected after deployment: 1 function, plpgsql, index valid, anon can run search,
--         anon cannot run the helper.
-- Part 2: fingerprints for ten searches. The rows must match the earlier results for the same searches
--         (name_order_fingerprint, id_fingerprint, rows_returned). Fingerprints are shortened to 12 characters.

select 'search_facilities functions' as check_name,
       count(*)::text as result
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'search_facilities'
union all
select 'search_facilities language',
       coalesce((select l.lanname::text
                 from pg_proc p
                 join pg_namespace n on n.oid = p.pronamespace
                 join pg_language l on l.oid = p.prolang
                 where n.nspname = 'public' and p.proname = 'search_facilities'
                 limit 1), 'missing')
union all
select 'facilities_dedupe_key_idx valid',
       coalesce((select i.indisvalid::text
                 from pg_index i
                 join pg_class c on c.oid = i.indexrelid
                 where c.relname = 'facilities_dedupe_key_idx'), 'missing')
union all
select 'anon can run search_facilities',
       has_function_privilege('anon', 'public.search_facilities(text,text,text,text,integer,integer)', 'EXECUTE')::text
union all
select 'anon cannot run facility_dedupe_key',
       (not has_function_privilege('anon', 'public.facility_dedupe_key(text,text,text,text,text)', 'EXECUTE'))::text;

with cases(label, query_text, state_filter, city_filter, postal_filter) as (
  values
    ('01 one letter a',            'a',      null,  null,           null),
    ('02 care',                    'care',   null,  null,           null),
    ('03 nationwide, no filters',  null,     null,  null,           null),
    ('04 state CA',                null,     'CA',  null,           null),
    ('05 state MN',                null,     'MN',  null,           null),
    ('06 minneapolis in MN',       null,     'MN',  '%minneapolis%', null),
    ('07 minneapolis nationwide',  null,     null,  '%minneapolis%', null),
    ('08 zip 55401',               null,     null,  null,           '55401'),
    ('09 Guardian in MN',          'Guardian', 'MN', null,          null),
    ('10 no match abc',            null,     null,  '%abc%',        null)
)
select c.label,
       count(s.id) as rows_returned,
       left(md5(coalesce(string_agg(s.id::text, ',' order by s.id), '')), 12) as id_fingerprint,
       left(md5(coalesce(string_agg(s.name, '|' order by s.ordinality), '')), 12) as name_order_fingerprint
from cases c
left join lateral public.search_facilities(c.query_text, c.state_filter, c.city_filter, c.postal_filter, 50, 0)
  with ordinality as s on true
group by c.label
order by c.label;
