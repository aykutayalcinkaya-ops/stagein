-- 027_marketplace_offers_and_details.sql
-- İkinci el ürün tablosuna ek parametreler
alter table marketplace_items
  add column if not exists brand text,
  add column if not exists model text,
  add column if not exists condition text default 'used' check (condition in ('brand_new', 'like_new', 'very_good', 'good', 'needs_repair')),
  add column if not exists category text default 'guitar',
  add column if not exists is_open_to_trade boolean default false,
  add column if not exists view_count integer default 0;

-- Teklif Verme Sistemi (Offers)
create table if not exists marketplace_offers (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references marketplace_items(id) on delete cascade,
  buyer_id uuid references users(id) on delete cascade,
  seller_id uuid references users(id) on delete cascade,
  offer_amount numeric(10,2) not null,
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'countered', 'cancelled')),
  counter_amount numeric(10,2),
  created_at timestamptz default now()
);

alter table marketplace_offers enable row level security;

create policy "Buyers and sellers can view their offers"
  on marketplace_offers for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Authenticated buyers can make offers"
  on marketplace_offers for insert
  with check (auth.uid() = buyer_id);

create policy "Sellers and buyers can update offer status"
  on marketplace_offers for update
  using (auth.uid() = seller_id or auth.uid() = buyer_id);
