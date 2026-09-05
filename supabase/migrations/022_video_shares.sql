-- Migration: 022_video_shares.sql
-- Created: 2026-09-04
-- Amac: Bir videoyu kendi duvarina paylasma (repost) ozelligi (post_shares ile ayni desen).

create table if not exists video_shares (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  shared_to_wall boolean not null default true,
  caption text,
  created_at timestamptz default now(),
  unique (video_id, user_id)
);

alter table video_shares enable row level security;

create policy "Anyone can view video shares" on video_shares for select using (true);
create policy "Owner can insert video shares" on video_shares for insert with check (auth.uid() = user_id);
create policy "Owner can delete video shares" on video_shares for delete using (auth.uid() = user_id);

-- videos.share_count: paylasim sayaci.
alter table videos add column if not exists share_count integer not null default 0;

-- video_shares insert/delete sonrasi ilgili videonun share_count'unu guncelleyen
-- trigger fonksiyonu. security definer: RLS'i bypass ederek videos tablosunu
-- guncelleyebilsin.
create or replace function update_video_share_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'INSERT') then
    update videos set share_count = share_count + 1 where id = new.video_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update videos set share_count = greatest(share_count - 1, 0) where id = old.video_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger video_shares_count_insert
  after insert on video_shares
  for each row execute function update_video_share_count();

create trigger video_shares_count_delete
  after delete on video_shares
  for each row execute function update_video_share_count();
