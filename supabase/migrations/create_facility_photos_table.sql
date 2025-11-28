-- Create facility_photos table
create table if not exists facility_photos (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references facilities(id) on delete cascade not null,
  url text not null,
  caption text,
  display_order integer default 0,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table facility_photos enable row level security;

-- Policies
-- Public can view photos
create policy "Public can view photos"
  on facility_photos for select
  using ( true );

-- Owners can insert photos for their facilities
create policy "Owners can insert photos"
  on facility_photos for insert
  with check (
    exists (
      select 1 from facilities
      where facilities.id = facility_photos.facility_id
      and facilities.owner_id = auth.uid()
    )
  );

-- Owners can update their own photos
create policy "Owners can update photos"
  on facility_photos for update
  using (
    exists (
      select 1 from facilities
      where facilities.id = facility_photos.facility_id
      and facilities.owner_id = auth.uid()
    )
  );

-- Owners can delete their own photos
create policy "Owners can delete photos"
  on facility_photos for delete
  using (
    exists (
      select 1 from facilities
      where facilities.id = facility_photos.facility_id
      and facilities.owner_id = auth.uid()
    )
  );
