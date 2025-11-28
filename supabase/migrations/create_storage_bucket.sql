-- Create a new storage bucket for facility photos
insert into storage.buckets (id, name, public)
values ('facility-photos', 'facility-photos', true)
on conflict (id) do nothing;

-- Policy: Public can view photos
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'facility-photos' );

-- Policy: Authenticated users can upload photos
drop policy if exists "Authenticated Upload" on storage.objects;
create policy "Authenticated Upload"
  on storage.objects for insert
  with check (
    bucket_id = 'facility-photos' 
    and auth.role() = 'authenticated'
  );

-- Policy: Users can update their own photos (simplified for MVP)
drop policy if exists "Authenticated Update" on storage.objects;
create policy "Authenticated Update"
  on storage.objects for update
  using ( bucket_id = 'facility-photos' and auth.role() = 'authenticated' );

-- Policy: Users can delete their own photos (simplified for MVP)
drop policy if exists "Authenticated Delete" on storage.objects;
create policy "Authenticated Delete"
  on storage.objects for delete
  using ( bucket_id = 'facility-photos' and auth.role() = 'authenticated' );
