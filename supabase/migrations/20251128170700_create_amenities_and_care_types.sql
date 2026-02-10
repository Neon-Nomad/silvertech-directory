-- Create amenities table
create table if not exists amenities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null, -- 'Dining', 'Activities', 'Services', 'Outdoor', 'Tech', etc.
  icon text, -- Lucide icon name
  created_at timestamp with time zone default now()
);

-- Create care_types table
create table if not exists care_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamp with time zone default now()
);

-- Create facility_amenities junction table
create table if not exists facility_amenities (
  facility_id uuid references facilities(id) on delete cascade not null,
  amenity_id uuid references amenities(id) on delete cascade not null,
  primary key (facility_id, amenity_id)
);

-- Create facility_care_types junction table
create table if not exists facility_care_types (
  facility_id uuid references facilities(id) on delete cascade not null,
  care_type_id uuid references care_types(id) on delete cascade not null,
  primary key (facility_id, care_type_id)
);

-- Enable RLS
alter table amenities enable row level security;
alter table care_types enable row level security;
alter table facility_amenities enable row level security;
alter table facility_care_types enable row level security;

-- Policies for amenities and care_types (Public read, Admin write - simplified to public read for now)
create policy "Public can view amenities" on amenities for select using (true);
create policy "Public can view care_types" on care_types for select using (true);

-- Policies for junction tables
-- Public can view
create policy "Public can view facility_amenities" on facility_amenities for select using (true);
create policy "Public can view facility_care_types" on facility_care_types for select using (true);

-- Owners can manage their facility's amenities
create policy "Owners can insert facility_amenities"
  on facility_amenities for insert
  with check (
    exists (
      select 1 from facilities
      where facilities.id = facility_amenities.facility_id
      and facilities.owner_id = auth.uid()
    )
  );

create policy "Owners can delete facility_amenities"
  on facility_amenities for delete
  using (
    exists (
      select 1 from facilities
      where facilities.id = facility_amenities.facility_id
      and facilities.owner_id = auth.uid()
    )
  );

-- Owners can manage their facility's care types
create policy "Owners can insert facility_care_types"
  on facility_care_types for insert
  with check (
    exists (
      select 1 from facilities
      where facilities.id = facility_care_types.facility_id
      and facilities.owner_id = auth.uid()
    )
  );

create policy "Owners can delete facility_care_types"
  on facility_care_types for delete
  using (
    exists (
      select 1 from facilities
      where facilities.id = facility_care_types.facility_id
      and facilities.owner_id = auth.uid()
    )
  );

-- Seed initial data
insert into amenities (name, category) values
  ('Restaurant-style Dining', 'Dining'),
  ('Room Service', 'Dining'),
  ('Special Dietary Menus', 'Dining'),
  ('Fitness Center', 'Activities'),
  ('Library', 'Activities'),
  ('Arts & Crafts Studio', 'Activities'),
  ('Game Room', 'Activities'),
  ('Housekeeping', 'Services'),
  ('Laundry Service', 'Services'),
  ('Transportation', 'Services'),
  ('24-Hour Staff', 'Services'),
  ('Garden', 'Outdoor'),
  ('Walking Paths', 'Outdoor'),
  ('Patio', 'Outdoor'),
  ('Wi-Fi', 'Tech'),
  ('Cable TV', 'Tech')
on conflict (name) do nothing;

insert into care_types (name, description) values
  ('Independent Living', 'Active senior living with minimal assistance.'),
  ('Assisted Living', 'Help with daily activities like bathing and dressing.'),
  ('Memory Care', 'Specialized care for Alzheimer''s and dementia.'),
  ('Skilled Nursing', '24-hour medical care and rehabilitation.'),
  ('Respite Care', 'Short-term stays for temporary care needs.'),
  ('Hospice Care', 'Compassionate end-of-life care.')
on conflict (name) do nothing;
