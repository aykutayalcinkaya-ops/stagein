-- Migration: 012_storage.sql
-- Create storage buckets with size limits, MIME types, and RLS policies

-- videos: 100MB, public
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 104857600, '{"video/*"}')
on conflict (id) do nothing;

-- avatars: 5MB, public
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, '{"image/*"}')
on conflict (id) do nothing;

-- listing-photos: 10MB, public
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 10485760, '{"image/*"}')
on conflict (id) do nothing;

-- marketplace-photos: 10MB, public
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marketplace-photos', 'marketplace-photos', true, 10485760, '{"image/*"}')
on conflict (id) do nothing;

-- audio-notes: 5MB, public
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audio-notes', 'audio-notes', true, 5242880, '{"audio/*"}')
on conflict (id) do nothing;

-- badge-documents: 10MB, private
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('badge-documents', 'badge-documents', false, 10485760, '{"application/pdf"}')
on conflict (id) do nothing;

-- RLS policies for storage.objects

-- Videos: public read, authenticated users can upload to own folder
create policy "Public read videos" on storage.objects
  for select using (bucket_id = 'videos');

create policy "Authenticated upload videos" on storage.objects
  for insert with check (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "User delete own videos" on storage.objects
  for delete using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Avatars: public read, authenticated users can upload to own folder
create policy "Public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Authenticated upload avatars" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "User delete own avatars" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Listing photos: public read, authenticated users can upload
create policy "Public read listing-photos" on storage.objects
  for select using (bucket_id = 'listing-photos');

create policy "Authenticated upload listing-photos" on storage.objects
  for insert with check (bucket_id = 'listing-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "User delete own listing-photos" on storage.objects
  for delete using (bucket_id = 'listing-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Marketplace photos: public read, authenticated users can upload
create policy "Public read marketplace-photos" on storage.objects
  for select using (bucket_id = 'marketplace-photos');

create policy "Authenticated upload marketplace-photos" on storage.objects
  for insert with check (bucket_id = 'marketplace-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "User delete own marketplace-photos" on storage.objects
  for delete using (bucket_id = 'marketplace-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Audio notes: public read, authenticated users can upload
create policy "Public read audio-notes" on storage.objects
  for select using (bucket_id = 'audio-notes');

create policy "Authenticated upload audio-notes" on storage.objects
  for insert with check (bucket_id = 'audio-notes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "User delete own audio-notes" on storage.objects
  for delete using (bucket_id = 'audio-notes' and auth.uid()::text = (storage.foldername(name))[1]);

-- Badge documents: private (admin only), users can upload to own folder
create policy "Admin read badge-documents" on storage.objects
  for select using (bucket_id = 'badge-documents' and exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  ));

create policy "Authenticated upload badge-documents" on storage.objects
  for insert with check (bucket_id = 'badge-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "User delete own badge-documents" on storage.objects
  for delete using (bucket_id = 'badge-documents' and auth.uid()::text = (storage.foldername(name))[1]);
