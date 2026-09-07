# StageIn — Proje Durumu

> **Bu dosya bir oturum özetidir, ne yapıldığını ve nereden devam edileceğini hatırlamak için.**
> Son güncelleme: 2026-09-07 (gravity.md uygulaması + UI/UX geçişi + mesajlaşma özelliği oturumu)
> Canlı: https://stagein-web.vercel.app · Repo: main dalı, hepsi push edilmiş durumda.

---

## Bu oturumda ne yapıldı (özet)

1. **gravity.md tam uygulaması** — 8 kritik hata + 20 kalite maddesi
2. **UI/UX Pro Max ile görsel zenginlik geçişi** — kart derinliği, boş durum/medya placeholder'ları, tipografi
3. **Canlıda bulunan prod hatalarının düzeltilmesi** (kullanıcı ekran görüntüleriyle bildirdi)
4. **Sıfırdan web mesajlaşma özelliği** — Faz 1 (temel) + Faz 2/3 (sesli mesaj, okundu bilgisi, yazıyor göstergesi, grup sohbeti, engelleme/şikayet)
5. **Küçük tutarlılık düzeltmeleri** (mükerrer sayaç gösterimleri)

Aşağıda her biri detaylı.

---

## 1. gravity.md — Tam Denetim ve Düzeltme

Orijinal talimat dosyası: `gravity.md` (repo kökü). Uygulama planı ve tam rapor:
- `docs/superpowers/plans/2026-09-06-gravity-fullsite-audit.md` (plan)
- `docs/superpowers/plans/2026-09-06-gravity-fullsite-audit-REPORT.md` (sonuç raporu, madde madde)

**Düzeltilen 8 kritik hata:** YouTube video ekleme, Keşfet'te çift beğeni/kalp ikonu, "Paylaş 1" hizası, post 3-nokta menüsü (Düzenle/Sil/Kopyala/Şikayet), sitewide filtre dropdown'ları, Keşfet geri/kapat butonları, profil çoklu seçim + hesap silme, %100 web uyumluluğu.

**Önemli keşif:** Bu uygulamada **hiç açık/light tema yok** — tek sabit koyu tema. "Karanlık modda beyaz" maddesi buna göre yorumlandı: sorun `dark:` sınıfı eksikliği değil, bazı bileşenlerin sabit açık renk paleti (`bg-white`, `bg-gray-*`) kullanmasıydı.

---

## 2. UI/UX Pro Max Görsel Zenginlik Geçişi

Kullanıcı siteyi "kötü görünüyor" olarak nitelendirdi. `ui-ux-pro-max` plugin'i (kurulu, `/plugin`) ile analiz edilip **mevcut marka paleti korunarak** (mor `#7C5CFF` + turuncu `#FF8A3D`, Oswald+Inter font çifti zaten "sosyal medya uygulaması" için doğru yöndeydi) derinlik/yoğunluk artırıldı:

- Yeni `apps/web/src/components/MediaPlaceholder.tsx` — eksik görsel/video alanlarında düz siyah kutu yerine ikon+gradyan
- `ui.tsx`'teki `Card`'a ince iç highlight + gölge
- İlanlar, Pazar, Freelance, Profil, Ayarlar, statik sayfalarda kart yoğunluğu/tipografi/emoji→lucide geçişi

**Not:** Bu geçiş 4 paralel ajanla yapılıyordu, ajanlar oturum rate-limit'ine takılınca Anasayfa/Wall/Keşfet grubu diğerlerinden daha az iş aldı (ama PostCard zaten iyi durumdaydı, kontrol edildi).

---

## 3. Canlıda Bulunan ve Düzeltilen Prod Hataları

Kullanıcı ekran görüntüleriyle bildirdi, ben kök nedenleri bulup düzelttim:

| Hata | Kök Neden | Düzeltme |
|---|---|---|
| `/ilanlar`, `/freelance` 500 hatası | `ui.tsx`'e eklenen `'use client'`, server component'lerden (`UserAvatar.tsx`) plain fonksiyon çağrısını (`cn()`) kırdı; `/freelance` de `motion.section`'ı server component'te doğrudan kullanıyordu | `cn` → yeni `apps/web/src/lib/cn.ts` (client-siz); yeni `FadeInSection.tsx` client wrapper |
| Freelance ilan oluşturulamıyor | `freelance_categories` tablosu prod'da **tamamen boştu** (migration şemayı oluşturdu ama veri eklemedi) — her ilan FK ihlaliyle patlıyordu | Migration `031` — 7 kategori seed edildi |
| İlanlar/Pazar'da oluşturma butonu yok | Sadece boş durumda "Uygulamayı İndir" (mobil yönlendirme!) vardı | Header'a her zaman görünen buton, boş durum linkleri düzeltildi |
| Keşfet'te çirkin/tutarsız reaksiyon | Emoji+sayı özeti diğer ikonlarla (sade ikon+sayı) tutarsızdı, tıklanabilir alan 44px'i doldurmuyordu | `ReactionPicker`'a `variant="icon"` eklendi |
| "Cevaplar" (video yorum) butonu | Hep sabit "0", hiç video yorum sistemi yok — sahte/işlevsiz | Kaldırıldı (video yorumları ayrı özellik, henüz yapılmadı) |
| Paylaş ikonu her zaman "0" gösteriyordu | `shareCount !== undefined` kontrolü 0'ı da true sayıyordu | `shareCount &&` kontrolüne çevrildi |
| Anasayfa'da mükerrer "👍 1" | Post gövdesinin altında ayrı bir özet + footer'da ReactionPicker aynı sayıyı iki kez gösteriyordu | Üstteki özet blok kaldırıldı |

**⚠️ Kritik ders (tekrarlanmasın):** `apps/web/src/components/ui.tsx` `'use client'` içeriyor. Bir **server component** (üstte `'use client'` olmayan, `await` ile veri çeken bir `page.tsx`):
- `cn()` gibi client modülünden plain fonksiyon **çağıramaz** (`@/lib/cn`'den import et)
- `motion.div`/`motion.section`'ı **doğrudan kullanamaz** (bunun yerine `@/components/FadeInSection` gibi küçük bir client wrapper kullan)
- Bu ikisi de production'da (`next build` + `next start`) hata verir ama **`next dev`'de sessiz kalabilir** — her zaman gerçek build ile test et.

---

## 4. Mesajlaşma Özelliği (Sıfırdan İnşa Edildi)

Plan dosyası: `docs/superpowers/plans/2026-09-07-web-mesajlasma-plani.md`

### Ne var
- `/mesajlar` (gelen kutusu) + `/mesajlar/[id]` (konuşma ekranı)
- 1:1 ve **grup sohbeti** (arama + çoklu seçim ile "Yeni Sohbet")
- Gerçek zamanlı mesaj güncelleme (Supabase Realtime)
- **Sesli mesaj** (kayıt + oynatma, `audio-notes` storage bucket)
- **Okundu bilgisi** ("Görüldü", sadece 1:1'de)
- **Yazıyor…** göstergesi (Realtime Broadcast, DB'siz)
- **Engelleme/Şikayet** (konuşma header'ında "···" menüsü)
- Web'deki tüm eski "uygulamadan mesaj at" linkleri (ilanlar, stüdyo, Keşfet, profil) gerçek sohbete bağlandı

### Mimari
- API: `apps/web/src/lib/api.ts` — Mesajlaşma + Moderasyon bölümleri (dosya sonunda)
- Hook'lar: `apps/web/src/hooks/useMessaging.ts`, `useModeration.ts`, `useRealtimeUpdates.ts` (`useMessagingRealtime`, `useTypingIndicator`)
- Bileşenler: `apps/web/src/components/messaging/` (ConversationList, MessageThread, MessageBubble, MessageComposer, VoiceRecorder, NewConversationModal, ReportUserDialog, StartConversationButton, utils.ts)

### Doğrulama durumu
- ✅ Tarayıcıda gerçek kullanıcıyla uçtan uca test edildi: konuşma oluşturma, mesaj gönderme/kalıcılık, gelen kutusu, kullanıcı arama, şikayet (DB yazımı toast ile doğrulandı)
- ⚠️ **Sesli mesaj kodda tamam ama mikrofon izni gerektirdiğinden otomatik tarayıcı testinde doğrulanamadı** — gerçek tarayıcında bir kez denenmeli.
- ⚠️ Grup sohbeti UI/API mantığı doğrulandı ama sistemde ikinci bir gerçek test kullanıcısı olmadığından tam grup akışı (3+ kişi) denenmedi.

### Bulunan yan hata
`conversations` tablosunda migration 032'den önce **hiç INSERT/UPDATE RLS politikası yoktu** — bu, mobil uygulamada da yeni konuşma başlatmanın muhtemelen hiç çalışmadığı anlamına geliyor. Düzeltildi.

---

## Veritabanı Migration'ları (bu oturumda eklenip push edilenler)

Hepsi `supabase db push --linked --include-all` ile prod'a uygulandı ve doğrulandı:

| # | Ne yapıyor |
|---|---|
| 024 | YouTube video desteği (`video_source`, `youtube_url`, `storage_path` nullable) — **daha önce yanlışlıkla "uygulanmış" işaretlenmişti ama hiç çalışmamıştı**, `migration repair` ile düzeltilip yeniden push edildi |
| 029 | Post düzenleme + şikayet (`posts.updated_at`, `post_reports` tablosu) |
| 030 | `delete_user_account()` RPC — hesap silme, 26 tablo taranarak yazıldı |
| 031 | `freelance_categories` seed verisi (7 kategori) |
| 032 | Mesajlaşma: `conversations` INSERT/UPDATE RLS + `conversation_reads` tablosu |
| 033 | `conversation_reads` için katılımcı SELECT politikası (okundu bilgisi) |
| 034 | `conversations.title` (grup sohbeti adı) |
| 035 | `user_blocks` + `user_reports` tabloları + `messages` insert politikasını engelleme kontrolü içerecek şekilde güncelleme |

**DB şifresi artık ortamda mevcut** (kullanıcı tarafından sağlandı, bu oturumda kullanıldı). Yeni migration yazıldığında:
```bash
export SUPABASE_DB_PASSWORD='<şifre>'
npx supabase db push --linked --include-all
```

---

## Bilinen Eksikler / Yarım Kalanlar

1. **Sesli mesaj** — gerçek tarayıcıda mikrofon izniyle test edilmeli.
2. **Video yorumları** — Keşfet'te hiç yok (sahte buton kaldırıldı, gerçek özellik henüz yapılmadı).
3. **`MarketplaceFilters.tsx`** ve **`ListingApplicationModal.tsx`** — kodda düzeltildi ama hiçbir sayfadan import edilmiyor (yarım kalmış/bağlanmamış).
4. **Grup sohbeti** — 3+ gerçek kullanıcı ile tam test edilmedi.
5. Mesajlaşma planındaki Faz 3 fikirleri (grup sohbeti zaten yapıldı ama): dosya/fotoğraf eki mesajlarda yok.

## Genel Mimari Notları (yeni oturumda hatırlanacak)

- **Tek sabit koyu tema**, `dark:` sınıfı kullanma — `globals.css`'teki token'ları (`bg-card`, `border-border`, `text-text` vb.) kullan.
- Marka renkleri: `--color-primary: #7C5CFF` (mor), `--color-accent: #FF8A3D` (turuncu). Font: Oswald (başlık) + Inter (gövde).
- `ui.tsx` `'use client'` — server component'lerden `cn`'i `@/lib/cn`'den al, animasyon için `FadeInSection` gibi wrapper kullan.
- Her prod değişikliğinden sonra **gerçek `next build` + `next start`** ile test et, `next dev` yetmez.
- Aynı repo üzerinde bazen paralel çalışan başka bir oturum (`stagein-a4`) olabilir — push öncesi `git fetch` + `git status` kontrolü alışkanlık haline getirildi.

---

## Nereden Devam Edilir

Bu dosyayı aç, yukarıdaki "Bilinen Eksikler" listesinden birini seç ya da yeni bir istek ver. Detaylı planlar için:
- `docs/superpowers/plans/2026-09-06-gravity-fullsite-audit-REPORT.md` (tam gravity.md raporu)
- `docs/superpowers/plans/2026-09-07-web-mesajlasma-plani.md` (mesajlaşma planı, Faz 2/3 artık tamamlandı)
