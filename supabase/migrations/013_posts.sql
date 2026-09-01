-- Migration: 013_posts.sql
-- Created: 2026-09-01

create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  body text,
  video_id uuid references videos(id) on delete set null,
  photo_urls text[] default '{}',
  like_count integer default 0,
  comment_count integer default 0,
  created_at timestamptz default now()
);

alter table posts enable row level security;

create policy "Anyone can view posts" on posts for select using (true);
create policy "Owner can insert posts" on posts for insert with check (auth.uid() = user_id);
create policy "Owner can delete posts" on posts for delete using (auth.uid() = user_id);

create table post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

alter table post_likes enable row level security;

create policy "Anyone can view post likes" on post_likes for select using (true);
create policy "Owner can insert post likes" on post_likes for insert with check (auth.uid() = user_id);
create policy "Owner can delete post likes" on post_likes for delete using (auth.uid() = user_id);

create table post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

alter table post_comments enable row level security;

create policy "Anyone can view post comments" on post_comments for select using (true);
create policy "Owner can insert post comments" on post_comments for insert with check (auth.uid() = user_id);
create policy "Author or post owner can delete comment" on post_comments for delete using (
  auth.uid() = user_id or auth.uid() = (select user_id from posts where id = post_id)
);

-- like_count maintenance

create or replace function update_post_like_count()
returns trigger language plpgsql security definer as $$
begin
  if (TG_OP = 'INSERT') then
    update posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger post_likes_count_insert
  after insert on post_likes
  for each row execute function update_post_like_count();

create trigger post_likes_count_delete
  after delete on post_likes
  for each row execute function update_post_like_count();

-- comment_count maintenance

create or replace function update_post_comment_count()
returns trigger language plpgsql security definer as $$
begin
  if (TG_OP = 'INSERT') then
    update posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger post_comments_count_insert
  after insert on post_comments
  for each row execute function update_post_comment_count();

create trigger post_comments_count_delete
  after delete on post_comments
  for each row execute function update_post_comment_count();
