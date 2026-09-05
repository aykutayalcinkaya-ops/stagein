-- Migration: 018_post_reactions.sql
-- Created: 2026-09-04
-- Amac: post_likes yerine gelen coklu emoji reaksiyon sistemi.
-- Bir kullanici bir posta 'like', 'love', 'wow', 'sad', 'angry', 'haha'
-- tiplerinden biriyle (veya spec geregi ayni anda birden fazlasiyla) reaksiyon
-- verebilir. posts.reactions jsonb kolonu tip bazli sayaclari tutar:
--   { "like": 5, "love": 2 }

create table if not exists post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'love', 'wow', 'sad', 'angry', 'haha')),
  created_at timestamptz default now(),
  unique (post_id, user_id, reaction_type)
);

alter table post_reactions enable row level security;

create policy "Anyone can view post reactions" on post_reactions for select using (true);
create policy "Owner can insert post reactions" on post_reactions for insert with check (auth.uid() = user_id);
create policy "Owner can delete post reactions" on post_reactions for delete using (auth.uid() = user_id);

-- posts.reactions: tip -> sayim jsonb map'i. like_count'un yerini alir.
alter table posts add column if not exists reactions jsonb not null default '{}'::jsonb;

-- Eski tekil like_count kolonunu kaldir (post_reactions + reactions jsonb ile degistirildi).
alter table posts drop column if exists like_count;

-- 013_posts.sql'de tanimlanan eski like_count trigger'lari artik var olmayan
-- kolona yaziyordu; post_likes tablosu (gecici olarak) durabilir ama sayac
-- bakimini artik post_reactions ustlendigi icin eski trigger/fonksiyonu temizliyoruz.
drop trigger if exists post_likes_count_insert on post_likes;
drop trigger if exists post_likes_count_delete on post_likes;
drop function if exists update_post_like_count();

-- post_reactions tablosundaki insert/update/delete sonrasi ilgili postun
-- reactions jsonb sayaclarini yeniden hesaplayan trigger fonksiyonu.
-- security definer: RLS'i bypass ederek posts tablosunu guncelleyebilsin.
create or replace function update_post_reactions_count()
returns trigger
language plpgsql
security definer
as $$
declare
  affected_post_id uuid;
begin
  if (TG_OP = 'DELETE') then
    affected_post_id := old.post_id;
  else
    affected_post_id := new.post_id;
  end if;

  update posts
  set reactions = coalesce(
    (
      select jsonb_object_agg(reaction_type, reaction_count)
      from (
        select reaction_type, count(*) as reaction_count
        from post_reactions
        where post_id = affected_post_id
        group by reaction_type
      ) counts
    ),
    '{}'::jsonb
  )
  where id = affected_post_id;

  if (TG_OP = 'DELETE') then
    return old;
  end if;
  return new;
end;
$$;

create trigger post_reactions_count_change
  after insert or update or delete on post_reactions
  for each row execute function update_post_reactions_count();
