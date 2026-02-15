-- Compatibility migration: ensure facilities.updated_at exists for read-model and dashboard timestamp dependencies.
alter table public.facilities
  add column if not exists updated_at timestamptz not null default now();
