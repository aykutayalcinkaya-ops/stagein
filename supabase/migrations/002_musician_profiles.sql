-- Migration: 002_musician_profiles.sql
-- Created: 2026-09-01

create table musician_profiles (
  user_id uuid references users(id) primary key,
  instruments text[] default '{}',
  genres text[] default '{}',
  experience_level text default 'beginner',
  is_open_to_gig boolean default true
);

alter table musician_profiles enable row level security;

create policy "Anyone can read musician profiles" on musician_profiles for select using (true);
create policy "Owner can update" on musician_profiles for update using (auth.uid() = user_id);
