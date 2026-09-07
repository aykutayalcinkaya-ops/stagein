-- 032_messaging_rls_and_reads.sql
--
-- Web mesajlaşma özelliği (bkz. docs/superpowers/plans/2026-09-07-web-mesajlasma-plani.md).
--
-- Kök neden bulundu: `conversations` tablosunda (005_conversations.sql)
-- yalnızca SELECT politikası vardı. INSERT/UPDATE politikası hiç
-- tanımlanmamıştı — RLS'de politika olmayan komut varsayılan olarak
-- reddedilir. `apps/mobile/lib/api.ts`'teki getOrCreateConversation()/
-- touchConversation() tam olarak bu iki işlemi yapıyor, yani bu tabloya
-- INSERT/UPDATE her yerde (mobil dahil) şimdiye kadar RLS ihlaliyle
-- başarısız oluyor olmalıydı.

create policy "Participants can create conversations" on conversations
  for insert with check (auth.uid() = any(participant_ids));

create policy "Participants can update own conversations" on conversations
  for update using (auth.uid() = any(participant_ids));

-- Okunmamış mesaj sayısı için: participant_ids bir array olduğundan
-- "bu kullanıcı bu konuşmayı en son ne zaman okudu" bilgisini conversations
-- tablosuna tek bir kolon olarak eklemek yerine (kaç katılımcı olursa olsun
-- kişi başı state gerektiği için) ayrı bir tablo daha doğru.
create table if not exists conversation_reads (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table conversation_reads enable row level security;

create policy "Users manage own read state" on conversation_reads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Gelen kutusu sıralaması ve mesaj sayfalaması için index'ler.
create index if not exists conversations_last_message_at_idx on conversations (last_message_at desc);
create index if not exists messages_conversation_id_created_at_idx on messages (conversation_id, created_at);
