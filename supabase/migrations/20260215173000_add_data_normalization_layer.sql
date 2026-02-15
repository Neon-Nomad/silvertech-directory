-- Data normalization layer: canonical records + dedupe/lineage + processing ledger.
-- Intentionally does not update append-only raw_* tables.

create table if not exists public.normalization_runs (
  id uuid primary key default gen_random_uuid(),
  source_system public.ingestion_source_system,
  status public.ingestion_batch_status not null default 'running',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  records_scanned integer not null default 0,
  records_normalized integer not null default 0,
  records_rejected integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.normalization_records (
  id uuid primary key default gen_random_uuid(),
  raw_event_id uuid not null references public.raw_events(id) on delete cascade,
  canonical_entity public.canonical_entity_kind not null,
  status public.ingestion_record_status not null default 'ingested',
  normalized_table text,
  normalized_record_id uuid,
  dedupe_key text,
  confidence_score numeric(5, 4),
  processing_error text,
  attempts integer not null default 1,
  first_processed_at timestamptz not null default now(),
  last_processed_at timestamptz not null default now(),
  run_id uuid references public.normalization_runs(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (raw_event_id),
  check (jsonb_typeof(metadata) = 'object'),
  check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1))
);

create table if not exists public.canonical_facility_records (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references public.facilities(id) on delete set null,
  source_priority smallint not null default 100,
  source_system public.ingestion_source_system not null,
  schema_version text not null default '1.0.0',
  dedupe_key text not null,
  canonical_payload jsonb not null,
  confidence_score numeric(5, 4),
  pii_present boolean not null default false,
  last_normalized_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dedupe_key),
  check (jsonb_typeof(canonical_payload) = 'object'),
  check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1))
);

create table if not exists public.canonical_lead_records (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  source_system public.ingestion_source_system not null,
  schema_version text not null default '1.0.0',
  dedupe_key text not null,
  canonical_payload jsonb not null,
  analytics_payload jsonb not null default '{}'::jsonb,
  confidence_score numeric(5, 4),
  pii_present boolean not null default true,
  last_normalized_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dedupe_key),
  check (jsonb_typeof(canonical_payload) = 'object'),
  check (jsonb_typeof(analytics_payload) = 'object'),
  check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1))
);

create table if not exists public.canonical_lead_event_records (
  id uuid primary key default gen_random_uuid(),
  raw_event_id uuid not null references public.raw_events(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  session_id uuid,
  source_system public.ingestion_source_system not null,
  schema_version text not null default '1.0.0',
  event_type text not null,
  occurred_at timestamptz not null,
  canonical_payload jsonb not null default '{}'::jsonb,
  confidence_score numeric(5, 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (raw_event_id),
  check (jsonb_typeof(canonical_payload) = 'object'),
  check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1))
);

create table if not exists public.canonical_identity_links (
  id uuid primary key default gen_random_uuid(),
  canonical_entity public.canonical_entity_kind not null,
  canonical_record_id uuid not null,
  raw_event_id uuid references public.raw_events(id) on delete set null,
  dedupe_key text not null,
  confidence_score numeric(5, 4),
  linked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (canonical_entity, dedupe_key),
  check (jsonb_typeof(metadata) = 'object'),
  check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1))
);

create index if not exists idx_normalization_records_status_last_processed
  on public.normalization_records (status, last_processed_at desc);

create index if not exists idx_normalization_records_entity_status
  on public.normalization_records (canonical_entity, status, last_processed_at desc);

create index if not exists idx_normalization_records_dedupe_key
  on public.normalization_records (dedupe_key);

create index if not exists idx_canonical_facility_records_facility
  on public.canonical_facility_records (facility_id, last_normalized_at desc);

create index if not exists idx_canonical_lead_records_lead
  on public.canonical_lead_records (lead_id, last_normalized_at desc);

create index if not exists idx_canonical_lead_event_records_occurred
  on public.canonical_lead_event_records (facility_id, occurred_at desc);

create index if not exists idx_canonical_identity_links_entity_linked
  on public.canonical_identity_links (canonical_entity, linked_at desc);

drop trigger if exists trg_normalization_runs_set_updated_at on public.normalization_runs;
create trigger trg_normalization_runs_set_updated_at
before update on public.normalization_runs
for each row
execute function public._set_updated_at();

drop trigger if exists trg_normalization_records_set_updated_at on public.normalization_records;
create trigger trg_normalization_records_set_updated_at
before update on public.normalization_records
for each row
execute function public._set_updated_at();

drop trigger if exists trg_canonical_facility_records_set_updated_at on public.canonical_facility_records;
create trigger trg_canonical_facility_records_set_updated_at
before update on public.canonical_facility_records
for each row
execute function public._set_updated_at();

drop trigger if exists trg_canonical_lead_records_set_updated_at on public.canonical_lead_records;
create trigger trg_canonical_lead_records_set_updated_at
before update on public.canonical_lead_records
for each row
execute function public._set_updated_at();

drop trigger if exists trg_canonical_lead_event_records_set_updated_at on public.canonical_lead_event_records;
create trigger trg_canonical_lead_event_records_set_updated_at
before update on public.canonical_lead_event_records
for each row
execute function public._set_updated_at();

alter table public.normalization_runs enable row level security;
alter table public.normalization_records enable row level security;
alter table public.canonical_facility_records enable row level security;
alter table public.canonical_lead_records enable row level security;
alter table public.canonical_lead_event_records enable row level security;
alter table public.canonical_identity_links enable row level security;

drop policy if exists "Service role manages normalization_runs" on public.normalization_runs;
create policy "Service role manages normalization_runs"
  on public.normalization_runs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role manages normalization_records" on public.normalization_records;
create policy "Service role manages normalization_records"
  on public.normalization_records
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role manages canonical_facility_records" on public.canonical_facility_records;
create policy "Service role manages canonical_facility_records"
  on public.canonical_facility_records
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role manages canonical_lead_records" on public.canonical_lead_records;
create policy "Service role manages canonical_lead_records"
  on public.canonical_lead_records
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role manages canonical_lead_event_records" on public.canonical_lead_event_records;
create policy "Service role manages canonical_lead_event_records"
  on public.canonical_lead_event_records
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role manages canonical_identity_links" on public.canonical_identity_links;
create policy "Service role manages canonical_identity_links"
  on public.canonical_identity_links
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.record_normalization_result(
  p_raw_event_id uuid,
  p_canonical_entity public.canonical_entity_kind,
  p_status public.ingestion_record_status,
  p_normalized_table text default null,
  p_normalized_record_id uuid default null,
  p_dedupe_key text default null,
  p_confidence_score numeric default null,
  p_processing_error text default null,
  p_run_id uuid default null,
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
  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'Metadata must be a JSON object';
  end if;

  insert into public.normalization_records (
    raw_event_id,
    canonical_entity,
    status,
    normalized_table,
    normalized_record_id,
    dedupe_key,
    confidence_score,
    processing_error,
    attempts,
    first_processed_at,
    last_processed_at,
    run_id,
    metadata
  )
  values (
    p_raw_event_id,
    p_canonical_entity,
    p_status,
    p_normalized_table,
    p_normalized_record_id,
    p_dedupe_key,
    p_confidence_score,
    p_processing_error,
    1,
    now(),
    now(),
    p_run_id,
    p_metadata
  )
  on conflict (raw_event_id)
  do update set
    canonical_entity = excluded.canonical_entity,
    status = excluded.status,
    normalized_table = excluded.normalized_table,
    normalized_record_id = excluded.normalized_record_id,
    dedupe_key = coalesce(excluded.dedupe_key, normalization_records.dedupe_key),
    confidence_score = coalesce(excluded.confidence_score, normalization_records.confidence_score),
    processing_error = excluded.processing_error,
    attempts = normalization_records.attempts + 1,
    last_processed_at = now(),
    run_id = coalesce(excluded.run_id, normalization_records.run_id),
    metadata = normalization_records.metadata || excluded.metadata
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_normalization_result(
  uuid,
  public.canonical_entity_kind,
  public.ingestion_record_status,
  text,
  uuid,
  text,
  numeric,
  text,
  uuid,
  jsonb
) from public;

grant execute on function public.record_normalization_result(
  uuid,
  public.canonical_entity_kind,
  public.ingestion_record_status,
  text,
  uuid,
  text,
  numeric,
  text,
  uuid,
  jsonb
) to authenticated;

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
     or nr.status in ('ingested', 'rejected')
  order by re.ingested_at asc
  limit greatest(1, least(coalesce(p_limit, 100), 1000));
$$;

revoke all on function public.get_pending_raw_events_for_normalization(integer) from public;
grant execute on function public.get_pending_raw_events_for_normalization(integer) to authenticated;

