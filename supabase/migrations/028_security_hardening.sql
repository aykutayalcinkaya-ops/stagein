-- 028_security_hardening.sql
-- Senior SecOps audit: eksik/hatalı RLS politikalarını düzeltir.
--
-- Bulgular:
-- 1) marketplace_offers: tek "for update" politikası hem alıcıya hem satıcıya
--    WITH CHECK olmadan serbest UPDATE izni veriyordu -> bir alıcı kendi
--    teklifini "accepted" yaparak satıcı onayını atlayabiliyordu.
-- 2) freelance_orders: hiç UPDATE politikası yoktu -> sipariş durumu
--    (requirements_pending -> in_progress -> delivered -> completed) hiçbir
--    zaman client'tan güncellenemiyordu (RLS tarafından tamamen bloke).
-- 3) freelance_reviews: satıcının "seller_reply" alanını doldurabilmesi için
--    UPDATE politikası yoktu.
-- 4) conversations / bookings: sadece SELECT politikası vardı, INSERT yoktu ->
--    bu tablolar client'tan hiçbir şekilde satır alamıyordu.

-- ---------------------------------------------------------------------------
-- 1) marketplace_offers: rol bazlı, alan kısıtlı UPDATE politikaları
-- ---------------------------------------------------------------------------
drop policy if exists "Sellers and buyers can update offer status" on marketplace_offers;

-- Satıcı: yalnızca kendi teklifini accepted/rejected/countered yapabilir ve
-- yalnızca karşı teklif verirken counter_amount değiştirebilir.
create policy "Sellers can respond to offers"
  on marketplace_offers for update
  using (auth.uid() = seller_id)
  with check (
    auth.uid() = seller_id
    and status in ('accepted', 'rejected', 'countered')
  );

-- Alıcı: yalnızca kendi teklifini iptal edebilir (statüyü başka bir şeye
-- çeviremez, tutarı değiştiremez).
create policy "Buyers can cancel own offers"
  on marketplace_offers for update
  using (auth.uid() = buyer_id)
  with check (auth.uid() = buyer_id and status = 'cancelled');

-- ---------------------------------------------------------------------------
-- 2) freelance_orders: durum makinesini onurlandıran UPDATE politikaları
-- ---------------------------------------------------------------------------
-- Satıcı: siparişi ilerletebilir (in_progress, delivered) veya anlaşmazlık
-- açabilir; buyer_id/seller_id/price/gig_id gibi alanları değiştiremez
-- (kontrolü application-layer + aşağıdaki check ile sınırlandırıyoruz).
create policy "Sellers can progress their orders"
  on freelance_orders for update
  using (auth.uid() = seller_id)
  with check (
    auth.uid() = seller_id
    and status in ('in_progress', 'delivered', 'disputed')
  );

-- Alıcı: gereksinim gönderdiğinde in_progress'e geçirir, teslimatı onaylar
-- (completed) veya revizyon ister; iptal de edebilir.
create policy "Buyers can advance their orders"
  on freelance_orders for update
  using (auth.uid() = buyer_id)
  with check (
    auth.uid() = buyer_id
    and status in ('in_progress', 'revision_requested', 'completed', 'cancelled', 'disputed')
  );

-- ---------------------------------------------------------------------------
-- 3) freelance_reviews: satıcı yanıtı için kısıtlı UPDATE
-- ---------------------------------------------------------------------------
create policy "Sellers can reply to their reviews"
  on freelance_reviews for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

-- ---------------------------------------------------------------------------
-- 4) conversations: katılımcı kendi id'sini içeren bir konuşma açabilir
-- ---------------------------------------------------------------------------
create policy "Participant can create conversation"
  on conversations for insert
  with check (auth.uid() = any(participant_ids));

-- Mevcut mesaj eklendiğinde son mesaj zamanını güncelleyebilmek için
-- katılımcıların conversations.last_message_at alanını güncellemesine izin
-- ver (başka alan değişmez, çünkü tek yazılabilir alan budur).
create policy "Participant can update last_message_at"
  on conversations for update
  using (auth.uid() = any(participant_ids))
  with check (auth.uid() = any(participant_ids));

-- ---------------------------------------------------------------------------
-- 5) bookings: kullanıcı kendi rezervasyonunu oluşturabilir/güncelleyebilir
-- ---------------------------------------------------------------------------
create policy "User can create own booking"
  on bookings for insert
  with check (auth.uid() = user_id);

create policy "Studio or user can update booking status"
  on bookings for update
  using (auth.uid() = studio_id or auth.uid() = user_id)
  with check (auth.uid() = studio_id or auth.uid() = user_id);
