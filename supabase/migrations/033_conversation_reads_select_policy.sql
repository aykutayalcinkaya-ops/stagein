-- 033_conversation_reads_select_policy.sql
--
-- "Görüldü" (read receipt) özelliği: bir kullanıcının kendi gönderdiği son
-- mesajın karşı taraf tarafından okunup okunmadığını görebilmesi için,
-- 032'deki "Users manage own read state" (for all, auth.uid() = user_id)
-- politikasına ek olarak, konuşmanın DİĞER katılımcılarının okuma
-- durumunu da SELECT edebilmesi gerekiyor. RLS'de aynı komut için birden
-- fazla permissive politika OR'lanır, bu yüzden mevcut politikayı bozmadan
-- ek bir SELECT politikası yeterli.

create policy "Participants can view read state" on conversation_reads
  for select using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id and auth.uid() = any(c.participant_ids)
    )
  );
