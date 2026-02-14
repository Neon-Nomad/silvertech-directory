-- Allow future lead source types without repeated schema edits
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'leads_source_check'
  ) then
    alter table leads drop constraint leads_source_check;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'leads_source_nonempty_check'
  ) then
    alter table leads
      add constraint leads_source_nonempty_check
      check (length(trim(source)) > 0);
  end if;
end $$;
