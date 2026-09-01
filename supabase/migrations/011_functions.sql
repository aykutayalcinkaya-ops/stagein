-- Migration: 011_functions.sql
-- Created: 2026-09-01

-- view count increment helper
create or replace function increment_view_count(video_id uuid)
returns void language sql security definer as $$
  update videos set view_count = view_count + 1 where id = video_id;
$$;
