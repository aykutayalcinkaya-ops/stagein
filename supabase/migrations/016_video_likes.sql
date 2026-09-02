-- Migration: 016_video_likes.sql
-- Created: 2026-09-02

create table video_likes (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (video_id, user_id)
);

alter table video_likes enable row level security;

create policy "Anyone can view video likes" on video_likes for select using (true);
create policy "Owner can like" on video_likes for insert with check (auth.uid() = user_id);
create policy "Owner can unlike" on video_likes for delete using (auth.uid() = user_id);
