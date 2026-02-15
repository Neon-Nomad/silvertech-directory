-- Data ingestion foundation: canonical contract + append-only raw layer.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'ingestion_source_system') then
    create type public.ingestion_source_system as enum (
      'web',
      'dashboard',
      'stripe',
      'import',
      'api',
      'manual',
      'system'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'canonical_entity_kind') then
    create type public.canonical_entity_kind as enum (
      'facility',
      'lead',
      'lead_event',
      'facility_profile',
      'qa_question',
      'qa_answer',
      'billing_event'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'ingestion_record_status') then
    create type public.ingestion_record_status as enum (
      'ingested',
      'normalized',
      'rejected',
      'archived'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'ingestion_batch_status') then
    create type public.ingestion_batch_status as enum (
      'running',
      'completed',
      'failed'
    );
  end if;
end $$;

create table if not exists public.ingestion_batches (
  id uuid primary key default gen_random_uuid(),
  source_system public.ingestion_source_system not null,
  source_ref text,
  schema_version text not null default '1.0.0',
  status public.ingestion_batch_status not null default 'running',
  row_count integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.raw_events (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.ingestion_batches(id) on delete set null,
  source_system public.ingestion_source_system not null,
  source_event_id text,
  canonical_entity public.canonical_entity_kind not null,
  schema_version text not null default '1.0.0',
  occurred_at timestamptz not null default now(),
  ingested_at timestamptz not null default now(),
  payload jsonb not null,
  payload_checksum text generated always as (md5(payload::text)) stored,
  processing_status public.ingestion_record_status not null default 'ingested',
  processing_error text,
  normalized_record_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  check (jsonb_typeof(payload) = 'object'),
  check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.raw_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.ingestion_batches(id) on delete set null,
  source_system public.ingestion_source_system not null,
  source_dataset text not null,
  source_snapshot_id text,
  schema_version text not null default '1.0.0',
  captured_at timestamptz not null,
  ingested_at timestamptz not null default now(),
  payload jsonb not null,
  payload_checksum text generated always as (md5(payload::text)) stored,
  record_count integer,
  processing_status public.ingestion_record_status not null default 'ingested',
  processing_error text,
  metadata jsonb not null default '{}'::jsonb,
  check (jsonb_typeof(payload) in ('object', 'array')),
  check (jsonb_typeof(metadata) = 'object')
);

create unique index if not exists idx_raw_events_source_event_unique
  on public.raw_events (source_system, source_event_id);

create unique index if not exists idx_raw_source_snapshots_source_unique
  on public.raw_source_snapshots (source_system, source_dataset, source_snapshot_id);

create index if not exists idx_raw_events_entity_occurred
  on public.raw_events (canonical_entity, occurred_at desc);

create index if not exists idx_raw_events_status_ingested
  on public.raw_events (processing_status, ingested_at desc);

create index if not exists idx_raw_events_checksum
  on public.raw_events (payload_checksum);

create index if not exists idx_raw_source_snapshots_status_ingested
  on public.raw_source_snapshots (processing_status, ingested_at desc);

create index if not exists idx_ingestion_batches_source_status_started
  on public.ingestion_batches (source_system, status, started_at desc);

create or replace function public._set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ingestion_batches_set_updated_at on public.ingestion_batches;
create trigger trg_ingestion_batches_set_updated_at
before update on public.ingestion_batches
for each row
execute function public._set_updated_at();

create or replace function public._enforce_append_only()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  raise exception 'Append-only table: % does not allow %', tg_table_name, tg_op;
end;
$$;

drop trigger if exists trg_raw_events_append_only on public.raw_events;
create trigger trg_raw_events_append_only
before update or delete on public.raw_events
for each row
execute function public._enforce_append_only();

drop trigger if exists trg_raw_source_snapshots_append_only on public.raw_source_snapshots;
create trigger trg_raw_source_snapshots_append_only
before update or delete on public.raw_source_snapshots
for each row
execute function public._enforce_append_only();

alter table public.ingestion_batches enable row level security;
alter table public.raw_events enable row level security;
alter table public.raw_source_snapshots enable row level security;

drop policy if exists "Service role manages ingestion_batches" on public.ingestion_batches;
create policy "Service role manages ingestion_batches"
  on public.ingestion_batches
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role manages raw_events" on public.raw_events;
create policy "Service role manages raw_events"
  on public.raw_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role manages raw_source_snapshots" on public.raw_source_snapshots;
create policy "Service role manages raw_source_snapshots"
  on public.raw_source_snapshots
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.ingest_raw_event(
  p_source_system public.ingestion_source_system,
  p_canonical_entity public.canonical_entity_kind,
  p_payload jsonb,
  p_source_event_id text default null,
  p_occurred_at timestamptz default now(),
  p_schema_version text default '1.0.0',
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Payload must be a JSON object';
  end if;

  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'Metadata must be a JSON object';
  end if;

  if coalesce(auth.role(), '') = 'anon' and (
    p_source_system <> 'web'
    or p_canonical_entity not in ('lead', 'lead_event')
  ) then
    raise exception 'Anonymous ingest is restricted to web lead signals';
  end if;

  insert into public.raw_events (
    source_system,
    source_event_id,
    canonical_entity,
    schema_version,
    occurred_at,
    payload,
    metadata
  )
  values (
    p_source_system,
    p_source_event_id,
    p_canonical_entity,
    coalesce(nullif(trim(p_schema_version), ''), '1.0.0'),
    p_occurred_at,
    p_payload,
    p_metadata
  )
  on conflict (source_system, source_event_id)
  do nothing
  returning id into v_id;

  if v_id is null and p_source_event_id is not null then
    select id
    into v_id
    from public.raw_events
    where source_system = p_source_system
      and source_event_id = p_source_event_id
    limit 1;
  end if;

  return v_id;
end;
$$;

revoke all on function public.ingest_raw_event(
  public.ingestion_source_system,
  public.canonical_entity_kind,
  jsonb,
  text,
  timestamptz,
  text,
  jsonb
) from public;

grant execute on function public.ingest_raw_event(
  public.ingestion_source_system,
  public.canonical_entity_kind,
  jsonb,
  text,
  timestamptz,
  text,
  jsonb
) to anon, authenticated;

