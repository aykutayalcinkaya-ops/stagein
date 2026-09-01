-- Migration: 014_profile_links.sql
-- Created: 2026-09-01

create table profile_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  label text not null,
  url text not null,
  position integer default 0,
  created_at timestamptz default now()
);

alter table profile_links enable row level security;

create policy "Anyone can view profile links" on profile_links for select using (true);
create policy "Owner can insert profile links" on profile_links for insert with check (auth.uid() = user_id);
create policy "Owner can update profile links" on profile_links for update using (auth.uid() = user_id);
create policy "Owner can delete profile links" on profile_links for delete using (auth.uid() = user_id);
