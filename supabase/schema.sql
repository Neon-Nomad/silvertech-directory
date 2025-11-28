-- 1. The canonical Supabase schema

-- Create facilities table
create table if not exists facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address_line1 text,
  address_line2 text,
  city text,
  state text not null,
  postal_code text,
  latitude double precision,
  longitude double precision,
  phone text,
  created_at timestamp default now()
);

-- Create facility_licensing table
create table if not exists facility_licensing (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references facilities(id) on delete cascade,
  license_number text,
  license_expiration date,
  bed_capacity integer,
  authority text default 'Indiana Department of Health',
  updated_at timestamp default now()
);

-- Add unique constraint to license_number to support upserts/lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_facility_licensing_number ON facility_licensing(license_number);

-- 3. Geolocation RPC

-- Enable extensions
create extension if not exists cube;
create extension if not exists earthdistance;

-- RPC function
create or replace function get_nearby_facilities(
  user_lat double precision,
  user_lng double precision,
  max_results integer default 20
)
returns setof facilities
language sql
as $$
  select *
  from facilities
  order by earth_distance(
    ll_to_earth(latitude, longitude),
    ll_to_earth(user_lat, user_lng)
  )
  limit max_results;
$$;

-- RLS Policies (Standard best practices)
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_licensing ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access facilities" ON facilities FOR SELECT USING (true);
CREATE POLICY "Public read access licensing" ON facility_licensing FOR SELECT USING (true);

-- Authenticated update access (for admin/service role)
CREATE POLICY "Service role update facilities" ON facilities FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role update licensing" ON facility_licensing FOR ALL USING (auth.role() = 'service_role');

-- Create reviews table
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references facilities(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  rating integer check (rating >= 1 and rating <= 5),
  content text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies
-- Public read access
CREATE POLICY "Public read access reviews" ON reviews FOR SELECT USING (true);

-- Authenticated insert access (users can create reviews)
CREATE POLICY "Authenticated insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Authenticated update access (users can update their own reviews)
CREATE POLICY "Authenticated update reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- Authenticated delete access (users can delete their own reviews)
CREATE POLICY "Authenticated delete reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);
