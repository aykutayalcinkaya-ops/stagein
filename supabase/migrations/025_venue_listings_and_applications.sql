-- 025_venue_listings_and_applications.sql
-- İlan tiplerine 'venue' (Mekan/Sahne) tipini ekleme
alter table listings drop constraint if exists listings_type_check;
alter table listings add constraint listings_type_check check (type in ('band', 'session', 'lesson', 'venue'));

-- Mekan/Sahne ilanları ve bütçe aralığı için ek alanlar
alter table listings
  add column if not exists budget_min numeric(10,2),
  add column if not exists budget_max numeric(10,2),
  add column if not exists event_date timestamptz,
  add column if not exists venue_name text;

-- İlana web üzerinden yapılan doğrudan başvurular
create table if not exists listing_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  applicant_id uuid references users(id) on delete cascade,
  message text not null,
  sample_video_id uuid references videos(id) on delete set null,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique(listing_id, applicant_id)
);

alter table listing_applications enable row level security;

create policy "Listing owner and applicant can view applications"
  on listing_applications for select
  using (
    auth.uid() = applicant_id or
    exists (select 1 from listings where id = listing_id and user_id = auth.uid())
  );

create policy "Authenticated users can apply"
  on listing_applications for insert
  with check (auth.uid() = applicant_id);

create policy "Listing owner can update application status"
  on listing_applications for update
  using (exists (select 1 from listings where id = listing_id and user_id = auth.uid()));
