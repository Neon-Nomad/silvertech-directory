-- Create leads table
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references facilities(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text not null,
  email text not null,
  message text,
  move_in_timeframe text,
  status text default 'new',
  created_at timestamp default now()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policies

-- Public insert access (anyone can submit a lead)
CREATE POLICY "Public insert leads" ON leads FOR INSERT WITH CHECK (true);

-- Facility owners can view leads for their facilities
CREATE POLICY "Owners can view leads" ON leads FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM facilities
    WHERE facilities.id = leads.facility_id
    AND facilities.owner_id = auth.uid()
  )
);

-- Users can view leads they submitted
CREATE POLICY "Users can view their own leads" ON leads FOR SELECT USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role full access leads" ON leads FOR ALL USING (auth.role() = 'service_role');
