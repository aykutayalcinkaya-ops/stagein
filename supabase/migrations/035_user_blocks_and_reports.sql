-- 035_user_blocks_and_reports.sql
--
-- Mesajlaşmada engelleme ve kullanıcı şikayeti. `post_reports` (029) sadece
-- gönderilere özel olduğundan, bir kişiyi doğrudan (bir gönderi olmadan)
-- şikayet etmek için ayrı, genel bir `user_reports` tablosu gerekiyor.

create table if not exists user_blocks (
  blocker_id uuid references users(id) on delete cascade,
  blocked_id uuid references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table user_blocks enable row level security;

create policy "Users manage own blocks" on user_blocks
  for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- Bir kullanıcının KENDİSİNİN engellenip engellenmediğini bilmesi gerekiyor
-- (ör. "Mesaj At" butonunu gizlemek için) — bu satırı sadece blocker
-- görebildiğinden (yukarıdaki politika), blocked_id = auth.uid() olan
-- satırları da görebilmesi için ayrı bir SELECT politikası.
create policy "Users can see who blocked them" on user_blocks
  for select using (auth.uid() = blocked_id);

create table if not exists user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references users(id) on delete cascade,
  reported_id uuid references users(id) on delete cascade,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'other')),
  context_type text check (context_type in ('message', 'profile', 'listing', 'other')),
  context_id uuid,
  created_at timestamptz not null default now(),
  unique (reporter_id, reported_id, context_id)
);

alter table user_reports enable row level security;

create policy "Reporters can create reports" on user_reports
  for insert with check (auth.uid() = reporter_id);

create policy "Reporters can view own reports" on user_reports
  for select using (auth.uid() = reporter_id);

-- Engellenen kullanıcı mesaj gönderemesin: mevcut "Sender can insert"
-- politikası (006_messages.sql, yalnızca auth.uid() = sender_id kontrolü)
-- bu kontrolü içermiyordu ve RLS'de aynı komut için birden fazla permissive
-- politika OR'landığından, eski politika kaldırılıp yerine engelleme
-- kontrolü de içeren yenisi konuyor.
drop policy if exists "Sender can insert" on messages;

create policy "Sender can insert unless blocked" on messages
  for insert with check (
    auth.uid() = sender_id
    and not exists (
      select 1 from user_blocks b
      join conversations c on c.id = conversation_id
      where b.blocked_id = auth.uid()
        and b.blocker_id = any(c.participant_ids)
        and b.blocker_id <> auth.uid()
    )
  );
