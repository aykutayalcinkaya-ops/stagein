-- Migration: 009_endorsements.sql
-- Created: 2026-09-01

create table endorsements (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references users(id),
  to_user_id uuid references users(id),
  note text,
  created_at timestamptz default now(),
  unique(from_user_id, to_user_id)
);

alter table endorsements enable row level security;

create policy "Anyone can read endorsements" on endorsements for select using (true);
create policy "Authenticated can endorse" on endorsements for insert with check (auth.uid() = from_user_id);
