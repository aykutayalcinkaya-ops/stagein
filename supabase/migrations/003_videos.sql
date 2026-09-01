-- Migration: 003_videos.sql
-- Created: 2026-09-01

create table videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  storage_path text not null,
  hls_url text,
  thumbnail_url text,
  duration integer,
  city text,
  instruments text[] default '{}',
  genres text[] default '{}',
  like_count integer default 0,
  view_count integer default 0,
  created_at timestamptz default now()
);

alter table videos enable row level security;

create policy "Anyone can view videos" on videos for select using (true);
create policy "Owner can insert" on videos for insert with check (auth.uid() = user_id);
create policy "Owner can delete" on videos for delete using (auth.uid() = user_id);
