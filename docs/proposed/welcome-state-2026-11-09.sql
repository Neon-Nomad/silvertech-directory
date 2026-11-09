-- Durable, server-only state for the welcome email. Run once in the Supabase SQL Editor for project cqalqsyiiixbdoeabgyq.
--
-- Why: the welcome email must be sent at most once per account, across every server instance, and clients must not be
-- able to change that. Account metadata is editable by the account owner, so it is not used for this.
--
-- Who can touch these tables:
--   - Row Level Security is on and there are no policies, so anon and authenticated users can read or write nothing.
--   - Only the service role (the server, with a key that is never sent to a browser) can read or write.
--
-- Not run by the application. Not part of db push. Apply it by hand, after the owner reviews it.

begin;

-- One row per account that has been sent (or is being sent) its welcome email. The primary key is the guarantee.
create table if not exists public.welcome_email_sends (
  user_id uuid primary key references auth.users (id) on delete cascade,
  claimed_at timestamptz not null default now(),
  sent_at timestamptz,
  resend_id text
);

-- One row per hashed client address per hour. Counts requests so the limit holds across every server instance.
create table if not exists public.welcome_rate_limits (
  key text primary key,
  hits integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.welcome_email_sends enable row level security;
alter table public.welcome_rate_limits enable row level security;

revoke all on public.welcome_email_sends from public, anon, authenticated;
revoke all on public.welcome_rate_limits from public, anon, authenticated;

-- Increments the counter for one key and reports whether the request is still within the limit. One statement, so
-- concurrent requests cannot both pass the check.
create or replace function public.welcome_rate_hit(p_key text, p_limit integer)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_hits integer;
begin
  insert into public.welcome_rate_limits as r (key, hits, updated_at)
  values (p_key, 1, now())
  on conflict (key) do update
    set hits = r.hits + 1, updated_at = now()
  returning r.hits into v_hits;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.welcome_rate_hit(text, integer) from public, anon, authenticated;
grant execute on function public.welcome_rate_hit(text, integer) to service_role;

commit;

-- Verification (read-only). Expected: both tables rls_enabled = true, zero policies on each, and the function
-- executable by service_role only.
-- select relname, relrowsecurity from pg_class where relname in ('welcome_email_sends', 'welcome_rate_limits');
-- select tablename, count(*) from pg_policies where tablename in ('welcome_email_sends', 'welcome_rate_limits') group by tablename;
-- select has_function_privilege('anon', 'public.welcome_rate_hit(text,integer)', 'EXECUTE') as anon_can_run,
--        has_function_privilege('service_role', 'public.welcome_rate_hit(text,integer)', 'EXECUTE') as service_can_run;
