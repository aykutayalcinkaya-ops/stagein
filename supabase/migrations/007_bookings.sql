-- Migration: 007_bookings.sql
-- Created: 2026-09-01

create table bookings (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid references users(id),
  user_id uuid references users(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  total_price numeric(10,2),
  status text default 'pending' check (status in ('pending','confirmed','cancelled')),
  payment_id text,
  created_at timestamptz default now()
);

alter table bookings enable row level security;

create policy "Studio or user can read" on bookings for select using (auth.uid() = studio_id or auth.uid() = user_id);
