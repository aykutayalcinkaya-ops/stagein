-- 034_group_conversations.sql
--
-- Grup sohbeti desteği: conversations.participant_ids zaten bir array
-- olduğundan 2'den fazla katılımcıyı teknik olarak destekliyordu, ama grup
-- adı/başlığı için bir kolon yoktu (1:1 sohbette gereksiz, grupta gerekli).
-- INSERT/UPDATE RLS zaten 032'de participant_ids'e göre tanımlı — herhangi
-- bir katılımcı grup adını güncelleyebilir, bu bilinçli bir tercih (grup
-- sohbetlerinde herkesin adı değiştirebilmesi tipik bir davranıştır).

alter table conversations add column if not exists title text;
