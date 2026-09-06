-- 026_freelance_gigs_and_orders.sql
create table if not exists freelance_categories (
  id text primary key, -- 'mix-mastering', 'beat-production', 'session-musician', 'voiceover', 'songwriting', 'audio-editing', 'lessons'
  name text not null,
  icon text,
  description text
);

-- Freelance Hizmet İlanları (Gigs)
create table if not exists freelance_gigs (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references users(id) on delete cascade,
  category_id text references freelance_categories(id),
  title text not null, -- "Ben, ..."
  slug text unique,
  description text not null,
  cover_image text,
  audio_samples jsonb default '[]', -- [{ title: string, url: string, duration: number }]
  faq jsonb default '[]', -- [{ question: string, answer: string }]
  requirements text, -- Sipariş verildiğinde alıcıdan istenenler
  rating_avg numeric(3,2) default 5.0,
  rating_count integer default 0,
  order_queue_count integer default 0,
  status text default 'active' check (status in ('active', 'paused', 'draft')),
  created_at timestamptz default now()
);

-- 3 Kademeli Paketler (Basic, Standard, Premium)
create table if not exists freelance_packages (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid references freelance_gigs(id) on delete cascade,
  tier text check (tier in ('basic', 'standard', 'premium')),
  title text not null,
  description text not null,
  delivery_days integer not null,
  revisions_count integer not null default 1, -- 999 = Sınırsız
  price numeric(10,2) not null,
  features jsonb default '{}', -- { "wav_delivery": true, "commercial_rights": true, "stem_delivery": false }
  created_at timestamptz default now(),
  unique(gig_id, tier)
);

-- Freelance Siparişleri (Order Lifecycle & Escrow Hazırlığı)
create table if not exists freelance_orders (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid references freelance_gigs(id),
  package_id uuid references freelance_packages(id),
  buyer_id uuid references users(id),
  seller_id uuid references users(id),
  price numeric(10,2) not null,
  status text default 'requirements_pending' check (
    status in ('requirements_pending', 'in_progress', 'delivered', 'revision_requested', 'completed', 'cancelled', 'disputed')
  ),
  requirements_submitted text,
  delivered_files jsonb default '[]',
  delivery_note text,
  delivered_at timestamptz,
  auto_complete_at timestamptz, -- Teslimattan 72 saat sonra
  created_at timestamptz default now()
);

-- Yorumlar ve Değerlendirmeler
create table if not exists freelance_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references freelance_orders(id) unique,
  gig_id uuid references freelance_gigs(id),
  buyer_id uuid references users(id),
  seller_id uuid references users(id),
  rating integer check (rating between 1 and 5),
  comment text,
  seller_reply text,
  created_at timestamptz default now()
);

-- RLS Politikaları
alter table freelance_categories enable row level security;
alter table freelance_gigs enable row level security;
alter table freelance_packages enable row level security;
alter table freelance_orders enable row level security;
alter table freelance_reviews enable row level security;

create policy "Categories are readable by all" on freelance_categories for select using (true);
create policy "Active gigs are readable by all" on freelance_gigs for select using (status = 'active');
create policy "Sellers manage own gigs" on freelance_gigs for all using (auth.uid() = seller_id);
create policy "Packages readable by all" on freelance_packages for select using (true);
create policy "Sellers manage own packages" on freelance_packages for all using (
  exists (select 1 from freelance_gigs where id = gig_id and seller_id = auth.uid())
);
create policy "Order participants can read orders" on freelance_orders for select using (
  auth.uid() = buyer_id or auth.uid() = seller_id
);
create policy "Buyers can insert orders" on freelance_orders for insert with check (auth.uid() = buyer_id);
create policy "Reviews readable by all" on freelance_reviews for select using (true);
create policy "Buyers can create reviews" on freelance_reviews for insert with check (auth.uid() = buyer_id);
