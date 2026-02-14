-- Premium operator "Express Interest" mapping for anonymous no-results leads.

create table if not exists no_results_lead_interests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  operator_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'interested' check (status in ('interested', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_no_results_lead_interest_unique
  on no_results_lead_interests (lead_id, operator_user_id);

create index if not exists idx_no_results_lead_interest_operator_created_at
  on no_results_lead_interests (operator_user_id, created_at desc);

alter table no_results_lead_interests enable row level security;

-- Premium operators can see no-results demand leads.
drop policy if exists "Premium operators can view no-results leads" on leads;
create policy "Premium operators can view no-results leads"
  on leads
  for select
  using (
    source = 'no_results'
    and exists (
      select 1
      from user_profiles up
      where up.id = auth.uid()
        and coalesce(up.plan, 'free') in ('featured', 'priority', 'lead_suite')
    )
  );

-- Premium operators can insert their own interest mapping.
drop policy if exists "Premium operators can insert no-results interests" on no_results_lead_interests;
create policy "Premium operators can insert no-results interests"
  on no_results_lead_interests
  for insert
  with check (
    operator_user_id = auth.uid()
    and exists (
      select 1
      from leads l
      where l.id = lead_id
        and l.source = 'no_results'
    )
    and exists (
      select 1
      from user_profiles up
      where up.id = auth.uid()
        and coalesce(up.plan, 'free') in ('featured', 'priority', 'lead_suite')
    )
  );

-- Operators can read their own interest mappings.
drop policy if exists "Operators can view own no-results interests" on no_results_lead_interests;
create policy "Operators can view own no-results interests"
  on no_results_lead_interests
  for select
  using (operator_user_id = auth.uid());

-- Operators can update their own mapping status.
drop policy if exists "Operators can update own no-results interests" on no_results_lead_interests;
create policy "Operators can update own no-results interests"
  on no_results_lead_interests
  for update
  using (operator_user_id = auth.uid())
  with check (operator_user_id = auth.uid());
