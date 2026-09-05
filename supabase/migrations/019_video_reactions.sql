-- Migration: 019_video_reactions.sql
-- Created: 2026-09-04
-- Amac: video_likes yerine gelen coklu emoji reaksiyon sistemi (post_reactions ile ayni desen).
-- videos.reactions jsonb kolonu tip bazli sayaclari tutar: { "like": 5, "love": 2 }

create table if not exists video_reactions (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'love', 'wow', 'sad', 'angry', 'haha')),
  created_at timestamptz default now(),
  unique (video_id, user_id, reaction_type)
);

alter table video_reactions enable row level security;

create policy "Anyone can view video reactions" on video_reactions for select using (true);
create policy "Owner can insert video reactions" on video_reactions for insert with check (auth.uid() = user_id);
create policy "Owner can delete video reactions" on video_reactions for delete using (auth.uid() = user_id);

-- videos.reactions: tip -> sayim jsonb map'i. like_count'un yerini alir.
alter table videos add column if not exists reactions jsonb not null default '{}'::jsonb;

-- Eski tekil like_count kolonunu kaldir (video_reactions + reactions jsonb ile degistirildi).
-- Not: videos.like_count icin veritabani seviyesinde bir trigger yoktu (bakim
-- uygulama katmaninda apps/web/src/lib/api.ts icinden yapiliyordu), o yuzden
-- burada temizlenecek eski bir trigger/fonksiyon bulunmuyor.
alter table videos drop column if exists like_count;

-- video_reactions tablosundaki insert/update/delete sonrasi ilgili videonun
-- reactions jsonb sayaclarini yeniden hesaplayan trigger fonksiyonu.
-- security definer: RLS'i bypass ederek videos tablosunu guncelleyebilsin.
create or replace function update_video_reactions_count()
returns trigger
language plpgsql
security definer
as $$
declare
  affected_video_id uuid;
begin
  if (TG_OP = 'DELETE') then
    affected_video_id := old.video_id;
  else
    affected_video_id := new.video_id;
  end if;

  update videos
  set reactions = coalesce(
    (
      select jsonb_object_agg(reaction_type, reaction_count)
      from (
        select reaction_type, count(*) as reaction_count
        from video_reactions
        where video_id = affected_video_id
        group by reaction_type
      ) counts
    ),
    '{}'::jsonb
  )
  where id = affected_video_id;

  if (TG_OP = 'DELETE') then
    return old;
  end if;
  return new;
end;
$$;

create trigger video_reactions_count_change
  after insert or update or delete on video_reactions
  for each row execute function update_video_reactions_count();
