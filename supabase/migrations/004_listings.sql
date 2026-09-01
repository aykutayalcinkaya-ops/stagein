-- Migration: 004_listings.sql
-- Created: 2026-09-01

create table listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text check (type in ('band','session','lesson')),
  title text not null,
  description text,
  city text,
  instruments text[] default '{}',
  genres text[] default '{}',
  experience_level text,
  is_paid boolean default false,
  status text default 'active' check (status in ('active','closed','expired')),
  expires_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz default now()
);

alter table listings enable row level security;

create policy "Anyone can read active listings" on listings for select using (status = 'active');
create policy "Owner can manage" on listings for all using (auth.uid() = user_id);
