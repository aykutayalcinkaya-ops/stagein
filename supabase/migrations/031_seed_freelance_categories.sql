-- 031_seed_freelance_categories.sql
--
-- Kök neden bulundu (canlı DB'ye doğrudan REST sorgusuyla doğrulandı):
-- `freelance_categories` tablosu 026_freelance_gigs_and_orders.sql ile
-- oluşturuldu ama HİÇ satır eklenmedi. `freelance_gigs.category_id` bu
-- tabloya foreign key ile bağlı olduğundan, client'ın gönderdiği
-- `category_id` (örn. 'mix-mastering') tabloda karşılığı olmadığı için her
-- ilan oluşturma denemesi foreign-key ihlaliyle (23503) başarısız oluyor —
-- kullanıcıya "İlan oluşturulamadı" olarak yansıyan hata budur.
--
-- Bu satırlar `apps/web/packages/shared/src/constants.ts`'teki
-- FREELANCE_CATEGORIES sabitiyle birebir eşleşiyor (id/name).
--
-- RLS ile anon/authenticated rolüne INSERT izni verilmediğinden bu veri
-- yalnızca bir migration (postgres rolüyle) ile eklenebilir — API üzerinden
-- seed edilemedi, bu yüzden ayrı bir migration olarak burada.

insert into freelance_categories (id, name, icon, description) values
  ('mix-mastering', 'Mix & Mastering', 'sliders-horizontal', 'Profesyonel mix ve mastering hizmetleri'),
  ('beat-production', 'Müzik Prodüksiyonu & Beste', 'disc-3', 'Beat yapımı ve müzik prodüksiyonu'),
  ('session-musician', 'Enstrüman & Session Kayıt', 'mic-2', 'Session müzisyenlik ve enstrüman kaydı'),
  ('voiceover', 'Seslendirme & Dublaj', 'mic', 'Seslendirme ve dublaj hizmetleri'),
  ('songwriting', 'Şarkı Sözü & Beste', 'pen-tool', 'Şarkı sözü yazımı ve beste'),
  ('audio-editing', 'Ses Düzenleme & Restorasyon', 'wand-2', 'Ses düzenleme ve restorasyon'),
  ('lessons', 'Müzik Dersi & Danışmanlık', 'graduation-cap', 'Müzik dersi ve danışmanlık')
on conflict (id) do update set name = excluded.name, icon = excluded.icon, description = excluded.description;
