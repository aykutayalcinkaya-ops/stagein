-- Migration: 008_marketplace.sql
-- Created: 2026-09-01

create table marketplace_items (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  photos text[] default '{}',
  price numeric(10,2),
  city text,
  status text default 'active' check (status in ('active','sold','reserved')),
  created_at timestamptz default now()
);

alter table marketplace_items enable row level security;

create policy "Anyone can read active items" on marketplace_items for select using (status = 'active');
create policy "Seller can manage" on marketplace_items for all using (auth.uid() = seller_id);
