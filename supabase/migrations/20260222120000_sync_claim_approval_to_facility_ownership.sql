-- Keep claim status and facility ownership in sync.
-- When a claim is approved, automatically assign the facility owner.

create unique index if not exists idx_facility_claims_one_approved_per_facility
  on public.facility_claims (facility_id)
  where status = 'approved';

create or replace function public.sync_facility_ownership_from_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_assigned_plan_owner boolean := false;
  v_has_claimed_at boolean := false;
  v_should_sync boolean := false;
begin
  if tg_op = 'INSERT' then
    v_should_sync := new.status = 'approved';
  elsif tg_op = 'UPDATE' then
    v_should_sync := new.status = 'approved'
      and (
        old.status is distinct from new.status
        or old.user_id is distinct from new.user_id
      );
  end if;

  if v_should_sync then
    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'facilities'
        and column_name = 'assigned_plan_owner_id'
    ) into v_has_assigned_plan_owner;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'facilities'
        and column_name = 'claimed_at'
    ) into v_has_claimed_at;

    if v_has_assigned_plan_owner and v_has_claimed_at then
      update public.facilities
      set
        owner_id = new.user_id,
        assigned_plan_owner_id = case
          when exists (select 1 from public.user_profiles up where up.id = new.user_id)
          then new.user_id
          else null
        end,
        claimed_at = coalesce(claimed_at, now())
      where id = new.facility_id;
    elsif v_has_assigned_plan_owner then
      update public.facilities
      set
        owner_id = new.user_id,
        assigned_plan_owner_id = case
          when exists (select 1 from public.user_profiles up where up.id = new.user_id)
          then new.user_id
          else null
        end
      where id = new.facility_id;
    elsif v_has_claimed_at then
      update public.facilities
      set
        owner_id = new.user_id,
        claimed_at = coalesce(claimed_at, now())
      where id = new.facility_id;
    else
      update public.facilities
      set owner_id = new.user_id
      where id = new.facility_id;
    end if;

    update public.facility_claims
    set
      status = 'rejected',
      updated_at = now()
    where facility_id = new.facility_id
      and id <> new.id
      and status = 'pending';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sync_facility_ownership_from_claim on public.facility_claims;
create trigger trg_sync_facility_ownership_from_claim
before insert or update on public.facility_claims
for each row
execute function public.sync_facility_ownership_from_claim();

notify pgrst, 'reload schema';
