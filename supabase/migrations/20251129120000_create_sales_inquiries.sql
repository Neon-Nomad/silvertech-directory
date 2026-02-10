-- Create sales_inquiries table
create table if not exists sales_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  community_name text,
  beds text,
  challenges text,
  status text default 'new', -- new, contacted, closed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table sales_inquiries enable row level security;

-- Policies
create policy "Public insert access"
  on sales_inquiries for insert
  with check ( true );

create policy "Service role full access"
  on sales_inquiries for all
  using ( auth.role() = 'service_role' );
