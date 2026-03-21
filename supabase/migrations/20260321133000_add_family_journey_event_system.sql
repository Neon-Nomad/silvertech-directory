-- Family Journey Event System foundation (FAM-01 -> FAM-05)
-- Deterministic status history, replay-safe writes, and strict transition enforcement.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'family_journey_status') then
    create type public.family_journey_status as enum (
      'researching',
      'touring',
      'shortlist',
      'selected',
      'moved_in',
      'declined'
    );
  end if;
end
$$;

create table if not exists public.idempotency_keys (
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null check (action_type in ('save', 'status', 'move_in', 'attribution')),
  idempotency_key uuid not null,
  response jsonb not null default '{}'::jsonb check (jsonb_typeof(response) = 'object'),
  http_status integer not null default 200 check (http_status >= 100 and http_status <= 599),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  primary key (user_id, action_type, idempotency_key)
);

create index if not exists idx_idempotency_keys_expires_at
  on public.idempotency_keys (expires_at asc);

create table if not exists public.saved_facilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  action_type text not null default 'save' check (action_type = 'save'),
  idempotency_key uuid not null,
  source text not null default 'web' check (source in ('web', 'mobile', 'import')),
  session_id uuid,
  local_sequence integer not null default 0 check (local_sequence >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, facility_id)
);

create unique index if not exists idx_saved_facilities_idempotency
  on public.saved_facilities (user_id, action_type, idempotency_key);

create index if not exists idx_saved_facilities_user_created
  on public.saved_facilities (user_id, created_at desc);

create table if not exists public.facility_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0 and char_length(content) <= 5000),
  source text not null default 'web' check (source in ('web', 'mobile', 'import')),
  session_id uuid,
  local_sequence integer not null default 0 check (local_sequence >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uniq_note_per_facility
  on public.facility_notes (user_id, facility_id);

create index if not exists idx_facility_notes_user_updated
  on public.facility_notes (user_id, updated_at desc);

create table if not exists public.tour_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  tour_at timestamptz not null,
  note text check (char_length(coalesce(note, '')) <= 1000),
  source text not null default 'web' check (source in ('web', 'mobile', 'import')),
  session_id uuid,
  local_sequence integer not null default 0 check (local_sequence >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_tour_logs_user_facility_tour_at
  on public.tour_logs (user_id, facility_id, tour_at asc);

create table if not exists public.facility_status_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  status public.family_journey_status not null,
  previous_status public.family_journey_status,
  action_type text not null default 'status' check (action_type = 'status'),
  idempotency_key uuid not null,
  source text not null default 'web' check (source in ('web', 'mobile', 'import')),
  session_id uuid,
  local_sequence integer not null default 0 check (local_sequence >= 0),
  created_at timestamptz not null default now(),
  check (previous_status is null or previous_status <> status)
);

create unique index if not exists idx_facility_status_history_idempotency
  on public.facility_status_history (user_id, action_type, idempotency_key);

create index if not exists idx_status_resolver
  on public.facility_status_history (user_id, facility_id, created_at desc, id desc);

create table if not exists public.move_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  move_in_month date not null,
  action_type text not null default 'move_in' check (action_type = 'move_in'),
  idempotency_key uuid not null,
  source text not null default 'web' check (source in ('web', 'mobile', 'import')),
  session_id uuid,
  local_sequence integer not null default 0 check (local_sequence >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, facility_id),
  check (move_in_month = date_trunc('month', move_in_month)::date)
);

create unique index if not exists idx_move_ins_idempotency
  on public.move_ins (user_id, action_type, idempotency_key);

create index if not exists idx_move_ins_user_created
  on public.move_ins (user_id, created_at desc);

create table if not exists public.attribution (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  attribution_type text not null check (attribution_type in ('major', 'somewhat', 'none')),
  action_type text not null default 'attribution' check (action_type = 'attribution'),
  idempotency_key uuid not null,
  source text not null default 'web' check (source in ('web', 'mobile', 'import')),
  session_id uuid,
  local_sequence integer not null default 0 check (local_sequence >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, facility_id)
);

create unique index if not exists idx_attribution_idempotency
  on public.attribution (user_id, action_type, idempotency_key);

create index if not exists idx_attribution_user_updated
  on public.attribution (user_id, updated_at desc);

create or replace function public.status_rank(p_status public.family_journey_status)
returns integer
language sql
immutable
as $$
  select case p_status
    when 'researching' then 1
    when 'touring' then 2
    when 'shortlist' then 3
    when 'selected' then 4
    when 'moved_in' then 5
    when 'declined' then 6
    else null
  end;
$$;

create or replace function public.validate_status_transition()
returns trigger
language plpgsql
as $$
declare
  v_current_status public.family_journey_status;
  v_current_rank integer;
  v_new_rank integer;
begin
  select fsh.status
    into v_current_status
  from public.facility_status_history fsh
  where fsh.user_id = new.user_id
    and fsh.facility_id = new.facility_id
  order by fsh.created_at desc, fsh.id desc
  limit 1;

  if v_current_status = 'moved_in' then
    raise exception 'Terminal state reached';
  end if;

  if v_current_status is not null and new.previous_status is distinct from v_current_status then
    raise exception 'previous_status mismatch (expected %, got %)', v_current_status, new.previous_status;
  end if;

  if v_current_status is not null and new.status = v_current_status then
    raise exception 'No-op status transition is not allowed';
  end if;

  -- any -> declined
  if new.status = 'declined' then
    return new;
  end if;

  -- moved_in must come from selected.
  if new.status = 'moved_in' then
    if v_current_status is distinct from 'selected' then
      raise exception 'moved_in requires selected as previous status';
    end if;
    return new;
  end if;

  -- initial status can start at researching/touring/shortlist/selected to support forward skips.
  if v_current_status is null or v_current_status = 'declined' then
    if new.status not in ('researching', 'touring', 'shortlist', 'selected') then
      raise exception 'Invalid initial status %', new.status;
    end if;
    return new;
  end if;

  v_current_rank := public.status_rank(v_current_status);
  v_new_rank := public.status_rank(new.status);

  if v_new_rank is null or v_current_rank is null then
    raise exception 'Unable to resolve status transition rank';
  end if;

  -- forward-only progression with optional skips.
  if v_new_rank < v_current_rank then
    raise exception 'Status regression is not allowed (% -> %)', v_current_status, new.status;
  end if;

  return new;
end;
$$;

create or replace function public.prevent_status_history_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'facility_status_history is append-only';
end;
$$;

drop trigger if exists trg_validate_status_transition on public.facility_status_history;
create trigger trg_validate_status_transition
  before insert on public.facility_status_history
  for each row
  execute function public.validate_status_transition();

drop trigger if exists trg_prevent_status_history_mutation on public.facility_status_history;
create trigger trg_prevent_status_history_mutation
  before update or delete on public.facility_status_history
  for each row
  execute function public.prevent_status_history_mutation();

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_facility_notes_updated_at on public.facility_notes;
create trigger trg_facility_notes_updated_at
  before update on public.facility_notes
  for each row
  execute function public.set_updated_at_timestamp();

drop trigger if exists trg_attribution_updated_at on public.attribution;
create trigger trg_attribution_updated_at
  before update on public.attribution
  for each row
  execute function public.set_updated_at_timestamp();

create or replace view public.current_facility_status as
select distinct on (user_id, facility_id)
  user_id,
  facility_id,
  status,
  created_at,
  id
from public.facility_status_history
order by user_id, facility_id, created_at desc, id desc;

create or replace view public.family_dashboard_snapshot as
select
  s.user_id,
  s.facility_id,
  cs.status,
  n.content as latest_note,
  t.tour_at as next_tour
from public.saved_facilities s
left join public.current_facility_status cs
  on cs.user_id = s.user_id
 and cs.facility_id = s.facility_id
left join lateral (
  select content
  from public.facility_notes
  where user_id = s.user_id
    and facility_id = s.facility_id
  order by updated_at desc
  limit 1
) n on true
left join lateral (
  select tour_at
  from public.tour_logs
  where user_id = s.user_id
    and facility_id = s.facility_id
    and tour_at >= now()
  order by tour_at asc
  limit 1
) t on true;

alter table public.idempotency_keys enable row level security;
alter table public.saved_facilities enable row level security;
alter table public.facility_notes enable row level security;
alter table public.tour_logs enable row level security;
alter table public.facility_status_history enable row level security;
alter table public.move_ins enable row level security;
alter table public.attribution enable row level security;

drop policy if exists "Users can read own idempotency keys" on public.idempotency_keys;
create policy "Users can read own idempotency keys"
  on public.idempotency_keys
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own idempotency keys" on public.idempotency_keys;
create policy "Users can insert own idempotency keys"
  on public.idempotency_keys
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own idempotency keys" on public.idempotency_keys;
create policy "Users can update own idempotency keys"
  on public.idempotency_keys
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own saved facilities" on public.saved_facilities;
create policy "Users can read own saved facilities"
  on public.saved_facilities
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own saved facilities" on public.saved_facilities;
create policy "Users can insert own saved facilities"
  on public.saved_facilities
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own saved facilities" on public.saved_facilities;
create policy "Users can delete own saved facilities"
  on public.saved_facilities
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own facility notes" on public.facility_notes;
create policy "Users can read own facility notes"
  on public.facility_notes
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own facility notes" on public.facility_notes;
create policy "Users can insert own facility notes"
  on public.facility_notes
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own facility notes" on public.facility_notes;
create policy "Users can update own facility notes"
  on public.facility_notes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own facility notes" on public.facility_notes;
create policy "Users can delete own facility notes"
  on public.facility_notes
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own tour logs" on public.tour_logs;
create policy "Users can read own tour logs"
  on public.tour_logs
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own tour logs" on public.tour_logs;
create policy "Users can insert own tour logs"
  on public.tour_logs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own tour logs" on public.tour_logs;
create policy "Users can update own tour logs"
  on public.tour_logs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own tour logs" on public.tour_logs;
create policy "Users can delete own tour logs"
  on public.tour_logs
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own status history" on public.facility_status_history;
create policy "Users can read own status history"
  on public.facility_status_history
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own status history" on public.facility_status_history;
create policy "Users can insert own status history"
  on public.facility_status_history
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own move ins" on public.move_ins;
create policy "Users can read own move ins"
  on public.move_ins
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own move ins" on public.move_ins;
create policy "Users can insert own move ins"
  on public.move_ins
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own attribution" on public.attribution;
create policy "Users can read own attribution"
  on public.attribution
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own attribution" on public.attribution;
create policy "Users can insert own attribution"
  on public.attribution
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own attribution" on public.attribution;
create policy "Users can update own attribution"
  on public.attribution
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on table public.idempotency_keys to authenticated;
grant select, insert, delete on table public.saved_facilities to authenticated;
grant select, insert, update, delete on table public.facility_notes to authenticated;
grant select, insert, update, delete on table public.tour_logs to authenticated;
grant select, insert on table public.facility_status_history to authenticated;
grant select, insert on table public.move_ins to authenticated;
grant select, insert, update on table public.attribution to authenticated;

grant select on table public.current_facility_status to authenticated;
grant select on table public.family_dashboard_snapshot to authenticated;
