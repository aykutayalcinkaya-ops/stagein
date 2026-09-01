-- Migration: 010_badge_applications.sql
-- Created: 2026-09-01

create table badge_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  badge_type text check (badge_type in ('blue','grey')),
  documents text[] default '{}',
  status text default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references users(id),
  created_at timestamptz default now()
);

alter table badge_applications enable row level security;

create policy "Owner can read own application" on badge_applications for select using (auth.uid() = user_id);
create policy "Owner can insert" on badge_applications for insert with check (auth.uid() = user_id);
