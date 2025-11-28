-- Drop table if it exists to ensure clean slate (fixes "column does not exist" errors if table was created incorrectly)
DROP TABLE IF EXISTS reviews;

-- Create reviews table
create table reviews (
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
