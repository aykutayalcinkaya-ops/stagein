-- Migration: 029_post_updates_and_reports.sql
-- Created: 2026-09-07
-- W2-FEED (gravity.md item 4, post 3-dot menu):
--
-- 1) "Düzenle" (edit post body) needs an UPDATE policy on `posts` — one never
--    existed (013_posts.sql only granted select/insert/delete), so any
--    client-side `update()` call would silently be blocked by RLS.
-- 2) "Şikayet Et" (report post) needs a `post_reports` table — none existed
--    in the schema at all.

alter table posts add column if not exists updated_at timestamptz;

create policy "Owner can update own posts" on posts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function set_post_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at
  before update on posts
  for each row execute function set_post_updated_at();

create table post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  reporter_id uuid references users(id) on delete cascade,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'other')),
  created_at timestamptz default now(),
  unique (post_id, reporter_id)
);

alter table post_reports enable row level security;

-- Reporter'ın kendi şikayetini oluşturabilmesi ve (insert().select() geri
-- dönüşü için) geri okuyabilmesi yeterli — moderasyon/inceleme paneli bu
-- görevin kapsamı dışında, ileride bir admin/service-role okuma politikası
-- eklenmesi gerekecek.
create policy "Reporter can insert own report" on post_reports
  for insert
  with check (auth.uid() = reporter_id);

create policy "Reporter can view own reports" on post_reports
  for select
  using (auth.uid() = reporter_id);
