-- Migration: 001_users.sql
-- Created: 2026-09-01

create table users (
  id uuid references auth.users primary key,
  email text unique not null,
  username text unique not null,
  full_name text,
  avatar_url text,
  city text,
  bio text,
  role text default 'musician',
  created_at timestamptz default now()
);

alter table users enable row level security;

create policy "Users can read all profiles" on users for select using (true);
create policy "Users can update own profile" on users for update using (auth.uid() = id);
