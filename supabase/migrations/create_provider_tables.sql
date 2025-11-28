-- Add owner_id to facilities table
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- Create facility_claims table
CREATE TABLE IF NOT EXISTS facility_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  business_email text,
  phone text,
  verification_doc_url text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text,
  created_at timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE facility_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policies for facility_claims
-- Users can create claims
CREATE POLICY "Users can create claims" ON facility_claims FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can view their own claims
CREATE POLICY "Users can view own claims" ON facility_claims FOR SELECT USING (auth.uid() = user_id);

-- Policies for leads
-- Public can insert leads (Contact Form)
CREATE POLICY "Public can insert leads" ON leads FOR INSERT WITH CHECK (true);
-- Owners can view leads for their facilities
CREATE POLICY "Owners can view leads" ON leads FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM facilities
    WHERE facilities.id = leads.facility_id
    AND facilities.owner_id = auth.uid()
  )
);

-- Policies for facilities (Update)
-- Owners can update their own facilities
CREATE POLICY "Owners can update own facilities" ON facilities FOR UPDATE USING (auth.uid() = owner_id);
