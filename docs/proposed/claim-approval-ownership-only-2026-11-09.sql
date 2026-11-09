-- Claim approval establishes ownership only. Proposed with the plan-owner assignment RPC; deploy in the same transaction.
--
-- Business rule: an approved claim makes the claimant the owner of the facility (owner_id, claimed_at). It never creates a
-- paid plan-slot assignment (facilities.assigned_plan_owner_id). Paid slots are chosen by the operator through
-- set_plan_owner_assignment(), and only from an active paid subscription.
--
-- Unchanged ownership protections:
--   * An approval may not replace an existing, different owner (the guard below, on every approval path).
--   * Approving one claim rejects the other pending claims on the same facility.
--   * The partial unique index on approved claims per facility is untouched.
--
-- Verification now comes from owner_id and claimed_at, both written only by this trigger. See MyFacilities.

begin;

create or replace function public.sync_facility_ownership_from_claim()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
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
    -- Ownership guard: an approval may not replace an existing, different owner.
    if exists (
      select 1
      from public.facilities f
      where f.id = new.facility_id
        and f.owner_id is not null
        and f.owner_id <> new.user_id
    ) then
      raise exception 'Facility already has an owner; the claim cannot be approved';
    end if;

    -- Ownership only. No paid plan-slot assignment is created here.
    update public.facilities
    set
      owner_id = new.user_id,
      claimed_at = coalesce(claimed_at, now())
    where id = new.facility_id;

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
$function$;

commit;
