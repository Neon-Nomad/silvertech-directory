-- Plan-owner assignment RPC. Proposed for review. NOT applied to production.
--
-- Replaces the direct client writes to facilities.assigned_plan_owner_id, which are no longer granted to clients
-- (see operator-claim-authorization-2026-11-09.sql). Every change goes through set_plan_owner_assignment().
--
-- Rules:
--   * The caller is auth.uid(). No user id is accepted from the browser.
--   * The caller must own a facility to assign it. Release needs only that the caller is the current plan owner.
--   * The slot limit comes from user_profiles.plan and billing_status, read inside the function. Only an active paid
--     subscription has slots. Free, past_due, canceled, and missing profiles have none. Keep the numbers in step with
--     src/config/pricing.ts (slotCount).
--   * Concurrency: the caller's user_profiles row is locked FOR UPDATE before the count and the change. Each operator's
--     assignment changes are serialized, so concurrent requests cannot exceed the limit. Facility rows are locked too.
--   * The function never reads or writes plan, billing_status, subscription ids, owner_id, or listing_tier.
--   * It writes facilities.assigned_plan_owner_id and, to keep the dashboard counter correct, user_profiles.facility_assignments_remaining.
--
-- Actions:
--   'assign'      p_facility_id: assign one owned facility to the caller.
--   'release'     p_facility_id: remove the caller's assignment from one facility.
--   'move'        p_facility_id (to) and p_from_facility_id (from): release one and assign another, atomically.
--   'release_all' remove every assignment the caller holds.

begin;

create or replace function public.operator_plan_slot_limit(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when up.billing_status is distinct from 'active' then 0
    when up.plan = 'featured' then 3
    when up.plan = 'priority' then 10
    when up.plan = 'lead_suite' then 25
    else 0
  end
  from (select 1) as one
  left join public.user_profiles up on up.id = p_user_id;
$$;

revoke all on function public.operator_plan_slot_limit(uuid) from public, anon, authenticated;

create or replace function public.set_plan_owner_assignment(
  p_action text,
  p_facility_id uuid default null,
  p_from_facility_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_action text := lower(coalesce(trim(p_action), ''));
  v_limit integer;
  v_count integer;
  v_owner uuid;
  v_assigned uuid;
  v_remaining integer;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if v_action not in ('assign', 'release', 'move', 'release_all') then
    raise exception 'Invalid action' using errcode = '22023';
  end if;

  -- Serialize this operator's assignment changes. Everything below runs under this lock.
  perform 1 from public.user_profiles where id = v_uid for update;

  v_limit := public.operator_plan_slot_limit(v_uid);

  if v_action = 'release_all' then
    update public.facilities
    set assigned_plan_owner_id = null
    where assigned_plan_owner_id = v_uid;

  elsif v_action in ('release', 'move') then
    if v_action = 'move' then
      if p_from_facility_id is null then
        raise exception 'p_from_facility_id is required for move' using errcode = '22023';
      end if;
      if p_from_facility_id = p_facility_id then
        raise exception 'Source and destination must differ' using errcode = '22023';
      end if;
      update public.facilities
      set assigned_plan_owner_id = null
      where id = p_from_facility_id and assigned_plan_owner_id = v_uid;
    end if;

    if v_action = 'release' then
      if p_facility_id is null then
        raise exception 'p_facility_id is required' using errcode = '22023';
      end if;
      update public.facilities
      set assigned_plan_owner_id = null
      where id = p_facility_id and assigned_plan_owner_id = v_uid;
    end if;
  end if;

  if v_action in ('assign', 'move') then
    if p_facility_id is null then
      raise exception 'p_facility_id is required' using errcode = '22023';
    end if;

    -- Lock the facility and check the caller's authority over it.
    select f.owner_id, f.assigned_plan_owner_id
    into v_owner, v_assigned
    from public.facilities f
    where f.id = p_facility_id
    for update;

    if not found then
      raise exception 'Facility not found' using errcode = 'P0001', hint = 'NOT_FOUND';
    end if;

    if v_owner is distinct from v_uid then
      raise exception 'Not authorized for this facility' using errcode = '42501';
    end if;

    if v_assigned is distinct from v_uid and v_assigned is not null then
      raise exception 'Facility is assigned to another plan owner' using errcode = '42501';
    end if;

    if v_assigned is distinct from v_uid then
      select count(*)::integer into v_count
      from public.facilities
      where assigned_plan_owner_id = v_uid;

      if v_count >= v_limit then
        raise exception 'ERR_SLOT_LIMIT: Plan slot limit reached' using errcode = 'P0001', hint = 'SLOT_LIMIT';
      end if;

      update public.facilities
      set assigned_plan_owner_id = v_uid
      where id = p_facility_id;
    end if;
  end if;

  select count(*)::integer into v_count
  from public.facilities
  where assigned_plan_owner_id = v_uid;

  v_remaining := greatest(v_limit - v_count, 0);

  update public.user_profiles
  set facility_assignments_remaining = v_remaining
  where id = v_uid;

  return jsonb_build_object(
    'assigned_count', v_count,
    'slot_limit', v_limit,
    'slots_remaining', v_remaining
  );
end;
$$;

revoke all on function public.set_plan_owner_assignment(text, uuid, uuid) from public, anon;
grant execute on function public.set_plan_owner_assignment(text, uuid, uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
