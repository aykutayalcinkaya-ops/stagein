-- Migration: 006_messages.sql
-- Created: 2026-09-01

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references users(id),
  content text,
  audio_url text,
  context_type text check (context_type in ('video','listing','direct')),
  context_id uuid,
  created_at timestamptz default now()
);

alter table messages enable row level security;

create policy "Participants can read messages" on messages for select
  using (exists (select 1 from conversations c where c.id = conversation_id and auth.uid() = any(c.participant_ids)));

create policy "Sender can insert" on messages for insert with check (auth.uid() = sender_id);
