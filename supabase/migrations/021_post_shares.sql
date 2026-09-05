-- Migration: 021_post_shares.sql
-- Created: 2026-09-04
-- Amac: Bir postu kendi duvarina paylasma (repost) ozelligi.

create table if not exists post_shares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  shared_to_wall boolean not null default true,
  caption text,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

alter table post_shares enable row level security;

create policy "Anyone can view post shares" on post_shares for select using (true);
create policy "Owner can insert post shares" on post_shares for insert with check (auth.uid() = user_id);
create policy "Owner can delete post shares" on post_shares for delete using (auth.uid() = user_id);

-- posts.share_count: paylasim sayaci.
alter table posts add column if not exists share_count integer not null default 0;

-- post_shares insert/delete sonrasi ilgili postun share_count'unu guncelleyen
-- trigger fonksiyonu. security definer: RLS'i bypass ederek posts tablosunu
-- guncelleyebilsin.
create or replace function update_post_share_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'INSERT') then
    update posts set share_count = share_count + 1 where id = new.post_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update posts set share_count = greatest(share_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger post_shares_count_insert
  after insert on post_shares
  for each row execute function update_post_share_count();

create trigger post_shares_count_delete
  after delete on post_shares
  for each row execute function update_post_share_count();
