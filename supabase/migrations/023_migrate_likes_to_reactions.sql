-- Migration: 023_migrate_likes_to_reactions.sql
-- Created: 2026-09-04
-- Amac: 016_video_likes.sql / 013_posts.sql'deki eski post_likes ve
-- video_likes tablolarindaki verileri, 018_post_reactions.sql ve
-- 019_video_reactions.sql ile eklenen yeni post_reactions / video_reactions
-- reaksiyon tablolarina 'like' tipiyle aktarir.
--
-- Onemli notlar:
-- - reaction_type, post_reactions/video_reactions tablolarinda bir enum
--   degil, CHECK kisitlamali `text` kolonudur (bkz. 018/019). Bu yuzden
--   'like'::reaction_type gibi bir enum cast'i YOKTUR/gerekmez; duz metin
--   'like' degeri kullanilir.
-- - post_reactions / video_reactions tablolarinda soft-delete icin bir
--   `deleted_at` kolonu bulunmuyor, dolayisiyla asagidaki sayim
--   sorgularinda boyle bir filtre kullanilmaz.
-- - post_reactions / video_reactions uzerinde zaten INSERT sonrasi
--   posts.reactions / videos.reactions jsonb kolonlarini otomatik guncelleyen
--   trigger'lar var (update_post_reactions_count / update_video_reactions_count).
--   Asagidaki INSERT'ler satir satir calistigi icin bu trigger'lar devreye
--   girer; 3. ve 4. adimdaki UPDATE'ler ekstra bir guvenlik/backfill katmani
--   olarak, trigger devre disi birakilmis olsa bile dogru sonucu garanti eder.
-- - Script idempotent'tir: ON CONFLICT DO NOTHING sayesinde birden fazla kez
--   calistirilabilir. post_likes / video_likes tablolari bu migration ile
--   SILINMEZ; denetim (audit) amaciyla saklanir (kaldirma islemi ileride,
--   Phase 10+ migration'larinda yapilacak).

begin;

-- 1) post_likes -> post_reactions ('like' tipiyle)
insert into post_reactions (post_id, user_id, reaction_type, created_at)
select pl.post_id, pl.user_id, 'like', pl.created_at
from post_likes pl
on conflict (post_id, user_id, reaction_type) do nothing;

-- 2) video_likes -> video_reactions ('like' tipiyle)
insert into video_reactions (video_id, user_id, reaction_type, created_at)
select vl.video_id, vl.user_id, 'like', vl.created_at
from video_likes vl
on conflict (video_id, user_id, reaction_type) do nothing;

-- 3) posts.reactions jsonb'sini post_reactions'tan yeniden hesapla (backfill).
--    Normalde bu iş update_post_reactions_count trigger'i tarafindan satir
--    bazinda zaten yapilir; burada tum etkilenen postlar icin topluca
--    dogrulama/backfill amaciyla tekrar hesaplaniyor.
update posts p
set reactions = coalesce(
  (
    select jsonb_object_agg(counts.reaction_type, counts.reaction_count)
    from (
      select reaction_type, count(*) as reaction_count
      from post_reactions
      where post_id = p.id
      group by reaction_type
    ) counts
  ),
  '{}'::jsonb
)
where id in (select distinct post_id from post_reactions);

-- 4) videos.reactions jsonb'sini video_reactions'tan yeniden hesapla (backfill).
update videos v
set reactions = coalesce(
  (
    select jsonb_object_agg(counts.reaction_type, counts.reaction_count)
    from (
      select reaction_type, count(*) as reaction_count
      from video_reactions
      where video_id = v.id
      group by reaction_type
    ) counts
  ),
  '{}'::jsonb
)
where id in (select distinct video_id from video_reactions);

-- 5) my_reaction alani icin bir seyin yapilmasina gerek yok: bu alan
--    kalici olarak saklanmiyor, API sorgularinda (Task 3) o an giris
--    yapmis kullanicinin kendi post_reactions/video_reactions satirindan
--    hesaplaniyor.

commit;

-- ---------------------------------------------------------------------
-- Dogrulama sorgulari (migration'in bir parcasi degildir, elle calistirin)
-- ---------------------------------------------------------------------
--
-- -- Eski/yeni kayit sayilari birbiriyle tutarli olmali (>= post_likes,
-- -- cunku ON CONFLICT DO NOTHING nedeniyle tekrar calistirmalar veri
-- -- duplike etmez, ama daha once elle eklenmis 'like' reaksiyonlari da
-- -- sayima dahil olabilir):
-- select count(*) as post_likes_old from post_likes;
-- select count(*) as post_reactions_like_new from post_reactions where reaction_type = 'like';
--
-- select count(*) as video_likes_old from video_likes;
-- select count(*) as video_reactions_like_new from video_reactions where reaction_type = 'like';
--
-- -- En cok 'like' reaksiyonu alan post:
-- select id, reactions
-- from posts
-- order by coalesce((reactions ->> 'like')::int, 0) desc
-- limit 1;
--
-- -- reactions jsonb kolonu dolu olan post/video sayisi:
-- select count(*) from posts where reactions <> '{}'::jsonb;
-- select count(*) from videos where reactions <> '{}'::jsonb;
