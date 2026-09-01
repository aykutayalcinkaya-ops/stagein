-- Migration: 005_conversations.sql
-- Created: 2026-09-01

create table conversations (
  id uuid primary key default gen_random_uuid(),
  participant_ids uuid[] not null,
  last_message_at timestamptz default now()
);

alter table conversations enable row level security;

create policy "Participants can read" on conversations for select using (auth.uid() = any(participant_ids));
