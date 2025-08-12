-- Create public bucket for order photos (idempotent)
insert into storage.buckets (id, name, public)
values ('order-photos', 'order-photos', true)
on conflict (id) do update set public = excluded.public;

-- Enable RLS on storage.objects (usually enabled by default)
alter table if exists storage.objects enable row level security;

-- Policy: Public read access for order-photos bucket
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read order-photos'
  ) then
    create policy "Public read order-photos" on storage.objects
      for select to anon
      using (bucket_id = 'order-photos');
  end if;
end$$;

-- Policy: Authenticated read access (optional)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated read order-photos'
  ) then
    create policy "Authenticated read order-photos" on storage.objects
      for select to authenticated
      using (bucket_id = 'order-photos');
  end if;
end$$;

-- Policy: Service-role writes bypass RLS; if you want to allow authenticated users to upload, uncomment:
-- create policy "Authenticated write order-photos" on storage.objects
--   for insert to authenticated
--   with check (bucket_id = 'order-photos');

