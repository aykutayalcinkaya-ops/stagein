-- Migration: 024_video_youtube_support.sql
-- Created: 2026-09-06
-- YouTube URL veya harici video URL desteği

alter table videos
  add column if not exists youtube_url text,
  add column if not exists video_source text default 'upload' check (video_source in ('upload', 'youtube', 'vimeo')),
  add column if not exists title text,
  add column if not exists description text;

-- Storage path null olabilir hale getirilmeli (YouTube videoları için dosya yüklenmeyebilir)
alter table videos alter column storage_path drop not null;

-- Indexleme
create index if not exists idx_videos_source on videos(video_source);
create index if not exists idx_videos_city_created on videos(city, created_at desc);
