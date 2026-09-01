-- Migration: 015_storage_post_photos.sql
-- Created: 2026-09-01

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-photos', 'post-photos', true, 10485760, '{"image/*"}')
on conflict (id) do nothing;

create policy "Public read post-photos" on storage.objects
  for select using (bucket_id = 'post-photos');

create policy "Authenticated upload post-photos" on storage.objects
  for insert with check (bucket_id = 'post-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "User delete own post-photos" on storage.objects
  for delete using (bucket_id = 'post-photos' and auth.uid()::text = (storage.foldername(name))[1]);
