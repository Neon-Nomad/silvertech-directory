-- Dead-letter and retry controls for normalization pipeline.

alter table public.normalization_records
  add column if not exists next_retry_at timestamptz not null default now(),
  add column if not exists dead_lettered_at timestamptz;

create index if not exists idx_normalization_records_retry_window
  on public.normalization_records (status, next_retry_at asc);

create table if not exists public.normalization_dead_letters (
  id uuid primary key default gen_random_uuid(),
  raw_event_id uuid not null unique references public.raw_events(id) on delete cascade,
  canonical_entity public.canonical_entity_kind not null,
  source_system public.ingestion_source_system,
  attempts integer not null,
  first_failed_at timestamptz not null,
  last_failed_at timestamptz not null,
  last_error text not null,
  dead_lettered_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  check (jsonb_typeof(metadata) = 'object')
);

create index if not exists idx_normalization_dead_letters_dead_lettered_at
  on public.normalization_dead_letters (dead_lettered_at desc);

create index if not exists idx_normalization_dead_letters_entity
  on public.normalization_dead_letters (canonical_entity, dead_lettered_at desc);

alter table public.normalization_dead_letters enable row level security;

drop policy if exists "Service role manages normalization_dead_letters" on public.normalization_dead_letters;
create policy "Service role manages normalization_dead_letters"
  on public.normalization_dead_letters
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.dead_letter_normalization_record(
  p_raw_event_id uuid,
  p_reason text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_entity public.canonical_entity_kind;
  v_attempts integer;
  v_first_failed_at timestamptz;
  v_last_failed_at timestamptz;
  v_error text;
  v_source public.ingestion_source_system;
begin
  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'Metadata must be a JSON object';
  end if;

  select
    nr.canonical_entity,
    nr.attempts,
    nr.first_processed_at,
    nr.last_processed_at,
    coalesce(nullif(trim(p_reason), ''), nr.processing_error, 'retry budget exhausted') as err,
    re.source_system
  into
    v_entity,
    v_attempts,
    v_first_failed_at,
    v_last_failed_at,
    v_error,
    v_source
  from public.normalization_records nr
  join public.raw_events re on re.id = nr.raw_event_id
  where nr.raw_event_id = p_raw_event_id;

  if v_entity is null then
    raise exception 'Normalization record not found for raw_event_id=%', p_raw_event_id;
  end if;

  insert into public.normalization_dead_letters (
    raw_event_id,
    canonical_entity,
    source_system,
    attempts,
    first_failed_at,
    last_failed_at,
    last_error,
    metadata
  )
  values (
    p_raw_event_id,
    v_entity,
    v_source,
    v_attempts,
    coalesce(v_first_failed_at, now()),
    coalesce(v_last_failed_at, now()),
    v_error,
    p_metadata
  )
  on conflict (raw_event_id)
  do update set
    attempts = excluded.attempts,
    last_failed_at = excluded.last_failed_at,
    last_error = excluded.last_error,
    dead_lettered_at = now(),
    metadata = public.normalization_dead_letters.metadata || excluded.metadata
  returning id into v_id;

  update public.normalization_records
  set
    status = 'archived',
    processing_error = v_error,
    dead_lettered_at = now(),
    updated_at = now()
  where raw_event_id = p_raw_event_id;

  return v_id;
end;
$$;

revoke all on function public.dead_letter_normalization_record(uuid, text, jsonb) from public;
grant execute on function public.dead_letter_normalization_record(uuid, text, jsonb) to authenticated;

create or replace function public.mark_normalization_record_retryable(
  p_raw_event_id uuid,
  p_next_retry_at timestamptz default now()
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  update public.normalization_records
  set
    status = 'ingested',
    processing_error = null,
    next_retry_at = coalesce(p_next_retry_at, now()),
    updated_at = now()
  where raw_event_id = p_raw_event_id
    and status = 'rejected'
    and dead_lettered_at is null;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

revoke all on function public.mark_normalization_record_retryable(uuid, timestamptz) from public;
grant execute on function public.mark_normalization_record_retryable(uuid, timestamptz) to authenticated;

create or replace function public.get_pending_raw_events_for_normalization(
  p_limit integer default 100
)
returns table (
  raw_event_id uuid,
  source_system public.ingestion_source_system,
  canonical_entity public.canonical_entity_kind,
  schema_version text,
  occurred_at timestamptz,
  payload jsonb,
  metadata jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    re.id as raw_event_id,
    re.source_system,
    re.canonical_entity,
    re.schema_version,
    re.occurred_at,
    re.payload,
    re.metadata
  from public.raw_events re
  left join public.normalization_records nr
    on nr.raw_event_id = re.id
  where nr.id is null
     or nr.status = 'ingested'
     or (
       nr.status = 'rejected'
       and coalesce(nr.next_retry_at, nr.last_processed_at, re.ingested_at) <= now()
       and nr.dead_lettered_at is null
     )
  order by re.ingested_at asc
  limit greatest(1, least(coalesce(p_limit, 100), 1000));
$$;

