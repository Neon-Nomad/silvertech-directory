-- Auto-approve facility claims when trust signals are strong.
-- Manual review remains the fallback for low-signal claims.

create or replace function public.auto_approve_facility_claim_if_trusted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_email text;
  v_email_confirmed boolean := false;
  v_claim_business_email text;
  v_claim_email_domain text;
  v_claim_phone_digits text;

  v_facility_domain text;
  v_facility_phone_digits text;
  v_domain_match boolean := false;
  v_phone_match boolean := false;
  v_has_domain_signal boolean := false;
  v_has_phone_signal boolean := false;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  -- Require a confirmed auth identity and matching business email.
  select
    lower(nullif(trim(u.email), '')),
    (u.email_confirmed_at is not null)
  into v_auth_email, v_email_confirmed
  from auth.users u
  where u.id = new.user_id;

  if coalesce(v_email_confirmed, false) = false then
    return new;
  end if;

  v_claim_business_email := lower(nullif(trim(new.business_email), ''));
  if v_claim_business_email is null or v_claim_business_email is distinct from v_auth_email then
    return new;
  end if;

  v_claim_email_domain := lower(nullif(split_part(v_claim_business_email, '@', 2), ''));
  v_claim_phone_digits := right(regexp_replace(coalesce(new.phone, ''), '\D', '', 'g'), 10);

  -- Only auto-approve unowned facilities.
  select
    lower(
      nullif(
        split_part(
          regexp_replace(
            regexp_replace(coalesce(f.website_url, ''), '^https?://', ''),
            '^www\.',
            ''
          ),
          '/',
          1
        ),
        ''
      )
    ),
    right(regexp_replace(coalesce(f.phone, f.verified_phone, ''), '\D', '', 'g'), 10)
  into v_facility_domain, v_facility_phone_digits
  from public.facilities f
  where f.id = new.facility_id
    and f.owner_id is null;

  if not found then
    return new;
  end if;

  v_has_domain_signal := v_facility_domain is not null and v_claim_email_domain is not null;
  v_has_phone_signal := length(v_facility_phone_digits) = 10 and length(v_claim_phone_digits) = 10;

  if v_has_domain_signal then
    v_domain_match := v_claim_email_domain = v_facility_domain;
  end if;

  if v_has_phone_signal then
    v_phone_match := v_claim_phone_digits = v_facility_phone_digits;
  end if;

  -- Decision matrix:
  -- 1) If both signals exist, require both to match.
  -- 2) If only one signal exists, require that one to match.
  if (
    (v_has_domain_signal and v_has_phone_signal and v_domain_match and v_phone_match)
    or (v_has_domain_signal and not v_has_phone_signal and v_domain_match)
    or (v_has_phone_signal and not v_has_domain_signal and v_phone_match)
  ) then
    update public.facility_claims
    set
      status = 'approved',
      updated_at = now()
    where id = new.id
      and status = 'pending';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_auto_approve_facility_claim on public.facility_claims;
create trigger trg_auto_approve_facility_claim
after insert on public.facility_claims
for each row
execute function public.auto_approve_facility_claim_if_trusted();

notify pgrst, 'reload schema';
