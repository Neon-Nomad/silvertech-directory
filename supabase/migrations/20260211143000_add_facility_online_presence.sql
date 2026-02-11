alter table public.facilities
  add column if not exists website_url text,
  add column if not exists google_maps_url text,
  add column if not exists verified_phone text,
  add column if not exists business_status text,
  add column if not exists online_presence_updated_at timestamptz;
