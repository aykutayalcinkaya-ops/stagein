-- Migration: 020_comment_replies.sql
-- Created: 2026-09-04
-- Amac: post_comments'e tek seviyeli (threaded) cevap ekleme ozelligi.

create table if not exists post_comment_replies (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references post_comments(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

alter table post_comment_replies enable row level security;

create policy "Anyone can view comment replies" on post_comment_replies for select using (true);
create policy "Owner can insert comment replies" on post_comment_replies for insert with check (auth.uid() = user_id);
-- Cevabi silebilecekler: cevabin sahibi ya da ust yorumun sahibi (post_comments.user_id).
create policy "Author or comment owner can delete reply" on post_comment_replies for delete using (
  auth.uid() = user_id or auth.uid() = (select user_id from post_comments where id = comment_id)
);

-- post_comments.reply_count: cevap sayisi (yorum karti UI'inda "N cevap" gostermek icin).
alter table post_comments add column if not exists reply_count integer not null default 0;

-- post_comment_replies insert/delete sonrasi ilgili yorumun reply_count'unu guncelleyen
-- trigger fonksiyonu. security definer: RLS'i bypass ederek post_comments tablosunu
-- guncelleyebilsin.
create or replace function update_post_comment_reply_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'INSERT') then
    update post_comments set reply_count = reply_count + 1 where id = new.comment_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update post_comments set reply_count = greatest(reply_count - 1, 0) where id = old.comment_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger post_comment_replies_count_insert
  after insert on post_comment_replies
  for each row execute function update_post_comment_reply_count();

create trigger post_comment_replies_count_delete
  after delete on post_comment_replies
  for each row execute function update_post_comment_reply_count();
