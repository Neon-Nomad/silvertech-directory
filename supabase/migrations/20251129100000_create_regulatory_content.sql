create table if not exists regulatory_content (
  state_slug text primary key,
  medicaid_content text,
  licensing_content text,
  ombudsman_content text,
  complaints_content text,
  veterans_content text,
  contacts_json jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table regulatory_content enable row level security;

create policy "Public read access regulatory_content"
  on regulatory_content for select
  using (true);

create policy "Service role update regulatory_content"
  on regulatory_content for all
  using (auth.role() = 'service_role');
