-- NY pilot batch 001: remove the 19 retired/consolidated facilities from claim eligibility.
-- Approved 2026-11-11. Matches supabase/seed-data/facility_claim_eligibility.sql on the pilot branch.
-- Before: 72246 eligible rows, md5(all ids) e45a0a56505a1700e1767c7d55309286. Expected after: 72227 rows.
-- Atomic: removes exactly 19 rows or nothing.
begin;
do $$
declare removed int;
begin
  delete from public.facility_claim_eligibility where facility_id in (
  '0a47de07-873a-44b3-bf96-00b501219ef8',
  '137c18af-2898-4902-ac44-ec33881dae8d',
  '287de3ec-aca7-4b09-8fcc-83d7981f60be',
  '358300b1-370f-4f19-98b3-095b7e819aac',
  '4992af2c-14dc-44a5-a37a-30ff870fc37e',
  '50a2f2d0-9c1b-40d1-8b0d-710bbf148d44',
  '583c2981-9db0-4206-8ea9-1ed8e36e64c0',
  '593bb824-c1aa-49f4-9c87-866a8d0c9dbd',
  '61f88735-d7f7-4e3f-a8ee-495faf57fe72',
  '6457dca6-7e98-4f5a-97f3-44021603bc81',
  '6b3818f0-2822-4ea5-a7da-fb28592086da',
  '7415f019-ee74-48c5-98e1-f488bb299093',
  '85fb79cb-7d55-49b8-ae9f-40146850f930',
  '9cbea41e-7f6d-487b-b934-71d06cc7f07c',
  'c4fc2c53-4b77-4d07-8c47-2259fda0712b',
  'd8ad410b-226a-4809-9770-21e679ac4909',
  'de8d9d70-e314-4421-91b2-4965b3e85baa',
  'e566f70a-8a8d-4590-b3f5-d1bc6d6d7752',
  'e688d37e-d37a-449a-a53c-090e33dac4d6'
  );
  get diagnostics removed = row_count;
  if removed <> 19 then
    raise exception 'expected to remove 19 rows, removed % (rolled back)', removed;
  end if;
end $$;
commit;
