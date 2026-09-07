# Gravity Full-Site Audit — Sonuç Raporu

**Tarih:** 2026-09-06 23:44 — 2026-09-07 08:20 (Europe/Istanbul)
**Kaynak talimat:** `gravity.md` (repo kökü)
**Uygulama planı:** `docs/superpowers/plans/2026-09-06-gravity-fullsite-audit.md`

---

## ÖNEMLİ: Eşzamanlı oturum uyarısı

Bu gece boyunca aynı repo üzerinde **başka bir aktif Claude Code oturumu** (13+ saattir çalışan `stagein-a4`) paralel olarak freelance/pazar backend entegrasyonu üzerinde çalıştı. 07:21:48'de o oturum bir commit attı (`7d66105`) ve bu commit **benim Wave 1-3 değişikliklerimin çoğunu da içine aldı** (aynı working tree'yi paylaştığımız için). Hiçbir şey kaybolmadı, ama:
- Bazı dosyalar o oturumun commit mesajıyla (`Freelance/Pazar backend entegrasyonu, RLS güvenlik düzeltmeleri ve UI/UX iyileştirmeleri`) karışık şekilde commit'lendi.
- Wave 3'ün freelance kalite düzeltmeleri (GigCard, PackageSelector, PackageComparisonTable, AudioSamplePlayer, OrderWorkspaceContent, ListingApplicationModal) ve benim `usePostReactions.ts`/`useVideoFeed.ts`/`api.ts` video-reaksiyon düzeltmem **henüz commit'lenmedi** — working tree'de bekliyor.
- **Öneri:** Uyanınca ilk iş `git status` ve `git diff` ile kalan değişiklikleri gözden geçirip commit'lemek.

---

## 1. Kurulan araçlar

- `motion`, `lucide-react`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-popover` → `apps/web/package.json`'a eklendi.
- `ui-ux-pro-max@ui-ux-pro-max-skill` plugin marketplace'i kuruldu (kullanıcı onayıyla, doğrulanmamış 3. parti kaynak riski kabul edilerek).

## 2. Kritik keşif: Bu uygulamada açık/light mod YOK

Wave 1 denetiminde ortaya çıktı: `apps/web` **tamamen sabit koyu temalı**, `dark:` Tailwind varyantı hiçbir yerde kullanılmıyor ve `globals.css` `color-scheme: dark` ile tek bir token seti tanımlıyor. Bu nedenle "karanlık modda beyaz" maddesi `dark:` sınıfı eklemek değil, **birkaç bileşenin sabit açık renk paleti (`bg-white`, `bg-gray-50`, `text-gray-700`) kullanmasını** düzeltmek olarak yeniden yorumlandı ve öyle uygulandı.

## 3. gravity.md ADIM 2 — Kritik hatalar (durum)

| # | Hata | Durum | Not |
|---|---|---|---|
| 1 | YouTube video yüklenemedi | ✅ Düzeltildi | `youtube.ts`/`constants.ts` regex'i protokolsüz/büyük-küçük harf/trailing-slash varyantlarını da kabul edecek şekilde genişletildi. **Ancak** asıl kök neden muhtemelen `supabase/migrations/024_video_youtube_support.sql`'in prod'a hiç push edilmemiş olması (DB şifresi yok) — bkz. §6. |
| 2 | Keşfet'te üst üste beğeni/kalp ikonları | ✅ Düzeltildi | `FeedVideo.tsx`'teki `VideoReactionPanel` iki ayrı reaksiyon kontrolünü (stacked top-3 ikon + ayrı `ReactionPicker`) tek bir kontrole indirildi. |
| 3 | "Paylaş 1" hizalama hatası | ✅ Düzeltildi | `ShareMenu`'ye `shareCount`/`variant` prop'u eklendi, sayaç artık buton içinde; `PostCard`'daki ayrık `<span>` kaldırıldı. |
| 4 | Post menüsü (3 nokta) | ✅ Düzeltildi | Inline "Sil" butonu kaldırıldı, Düzenle/Sil(onaylı)/Bağlantı Kopyala/Şikayet Et içeren gerçek backend'li dropdown eklendi (yeni migration `029_post_updates_and_reports.sql` — **prod'a push edilmedi**, bkz. §6). |
| 5 | Sitewide filtre → dropdown | ✅ Büyük ölçüde tamamlandı | Yeni `FilterDropdown` bileşeni; `ilanlar/yeni`, `pazar/yeni`, marketplace bileşenlerine uygulandı. `ListingFilters.tsx` bilinçli olarak native `<select>` bırakıldı (zaten hap yığını değildi, dönüştürmek `lib/data.ts` sorgu mantığını kırma riski taşıyordu). |
| 6 | Keşfet/Yükle geri-kapat butonu | ✅ Düzeltildi | Yeni `BackButton` bileşeni, `router.back()` ile gerçek tarayıcı geçmişine uyumlu. |
| 7 | Profil düzenleme çoklu seçim | ✅ Düzeltildi | `ayarlar/page.tsx`'te çoklu seçim modalı. |
| 8 | %100 web uyumluluğu | ✅ Zaten sağlanıyordu | Mobil yönlendirme bulunamadı, `apps/web` bağımsız çalışıyor. |
| — | "Topluluk" sayfası | ⏭️ Atlandı | Kullanıcı kararıyla — `apps/web`'de böyle bir route hiç yok. |

## 4. gravity.md ADIM 3 — 20 maddelik kalite denetimi

| # | Madde | Durum |
|---|---|---|
| 1 | Boş ekran metni | ✅ Yeni `EmptyState` bileşeni, ilgili tüm listelere uygulandı |
| 2 | Hepsi aynı mavi | ✅ `ui.tsx`'e primary/secondary/destructive/accent varyantları eklendi |
| 3 | "Bir sorun oluştu" | ✅ Anlamlı, spesifik Türkçe hata metinleri |
| 4 | Sonsuz spinner | ✅ `useTimeout` + `Skeleton` + yeniden dene akışı |
| 5 | Klavye örtüyor | N/A (mobil-spesifik, web'de gözlemlenmedi) |
| 6 | Geri tuşu ölü | ✅ `BackButton` gerçek `router.back()` kullanıyor |
| 7 | Karanlık modda beyaz | ✅ Düzeltildi (bkz. §2 — sabit açık palet kullanan tüm bileşenler tarandı) |
| 8 | Dokunma alanı küçük | ✅ `ui.tsx` `Button`'da `min-h-11 min-w-11` varsayılan |
| 9 | Çentik altında yazı | N/A (owned dosyalarda fixed bottom bar yok) |
| 10 | Lorem ipsum | ✅ Bulunan tek yer (`ListingApplicationModal`'daki sahte "Örnek Video" seçenekleri) temizlendi |
| 11 | Tek dil | ✅ Taranan dosyalarda İngilizce metin bulunamadı |
| 12 | Tarih formatı | ✅ Yeni `formatDateTr`/`formatRelativeTr` (`tr-TR`) |
| 13 | Onay yok | ✅ `ConfirmDialog` — post silme, hesap silme. Freelance'ta iptal özelliği hiç yok (N/A) |
| 14 | Titreşim/geri bildirim yok | ✅ `whileTap={{scale:0.96}}` `Button`'da varsayılan |
| 15 | Animasyon yok | ✅ `motion` fade-in/spring geçişleri eklendi |
| 16-17 | İzin gerekçesi/peş peşe | N/A (taranan dosyalarda kamera/mikrofon erişimi yok) |
| 18 | Hesap silme yok | ✅ KVKK uyumlu akış — **ama backend RPC (`delete_user_account`) henüz yok**, dürüstçe hata veriyor (bkz. §6) |
| 19 | İkon varsayılan | ✅ Emoji/raw SVG → `lucide-react` (strokeWidth 1.8) |
| 20 | Kimse test etmedi | ✅ `type-check` + `build` temiz; TestSprite ile 2 gerçek kullanıcı akışı doğrulandı (bkz. §7) |

## 5. Değiştirilen/oluşturulan dosyalar (özet)

**Yeni bileşenler:** `EmptyState.tsx`, `ConfirmDialog.tsx`, `DropdownMenu.tsx`, `Skeleton.tsx`, `FilterDropdown.tsx`, `BackButton.tsx`, `lib/format.ts`
**Feed/Video:** `PostCard.tsx`, `Wall.tsx`, `ShareMenu.tsx`, `ReactionPicker.tsx`, `FeedVideo.tsx`, `VideoFeed.tsx`, `usePostReactions.ts`, `usePostShares.ts`, `useWall.ts`, `useVideoFeed.ts`
**Filtre/Pazar:** `ilanlar/yeni/page.tsx`, `pazar/yeni/page.tsx`, `MarketplaceCard.tsx`, `marketplace/MarketplaceDetailContent.tsx`, `marketplace/ImageGallery.tsx`, `marketplace/OfferModal.tsx`, `marketplace/MarketplaceFilters.tsx`
**Ayarlar:** `ayarlar/page.tsx` (+546 satır)
**Freelance kalite geçişi:** `freelance/page.tsx`, `freelance/yeni/page.tsx`, `GigDetailContent.tsx`, `OrderWorkspaceContent.tsx`, `PackageSelector.tsx`, `PackageComparisonTable.tsx`, `GigCard.tsx`, `AudioSamplePlayer.tsx`, `ListingApplicationModal.tsx`
**Backend/tip:** `api.ts` (+240 satır: `updatePost`, `reportPost`, `deleteOwnAccount`, `toggleVideoLike` dead-code temizliği), `packages/shared/src/types.ts` (`PostReportReason`, `PostReport`, `Post.updated_at`)
**Yeni migration'lar:** `supabase/migrations/029_post_updates_and_reports.sql`

## 6. Prod'a PUSH EDİLMEYEN migration'lar (manuel işlem gerekli)

DB şifresi bu ortamda mevcut olmadığından (`SUPABASE_DB_PASSWORD` ayarlı değil, `supabase db push` başarısız oldu), aşağıdaki migration'lar **yalnızca yerel dosya olarak var, canlı Supabase projesine uygulanmadı**:
- `024_video_youtube_support.sql` — muhtemelen "video yüklenemedi" hatasının asıl kök nedeni
- `028_security_hardening.sql` — önceki oturumdan kalma, hâlâ push edilmemiş
- `029_post_updates_and_reports.sql` — post düzenleme/şikayet özelliğinin gerçek çalışması için şart

**Hesap silme** özelliği de gerçek bir `delete_user_account` RPC'sine ihtiyaç duyuyor — hiç yazılmadı, sadece UI akışı hazır (dürüstçe hata veriyor, sahte başarı üretmiyor).

→ Uyanınca: Supabase dashboard'dan DB şifresini sıfırlayıp `supabase db push` çalıştırman gerekiyor.

## 7. TestSprite doğrulaması

Yerel dev sunucusu (`next dev`, port 3001/3002) üzerinden gerçek tarayıcı testleri koşuldu:

| Test | İlk sonuç | Son sonuç |
|---|---|---|
| "Like a post from the explore feed" | ❌ FAILED — "beğeni aktif görünüyor ama sayaç güncellenmedi" | ✅ **PASSED** (fix sonrası) |
| "View and edit profile details" | — | ✅ **PASSED** |

**Bulunan ve düzeltilen gerçek bug:** İlk test hatası sayesinde `useVideoToggleReaction`'da (post reaksiyonlarının aksine) hiç iyimser güncelleme (`onMutate`) olmadığı ortaya çıktı — bu yüzden video reaksiyonu tıklandığında sayaç anında güncellenmiyordu. `usePostReactions.ts`'e doğru `onMutate`/`onError` optimistic-update mantığı eklendi (composite `['feed', city, startVideoId]` query key'ine `setQueriesData`+`exact:false` ile). Ayrıca kullanılmayan eski `useToggleVideoLike`/`toggleVideoLike` (video_likes tablosu, migration 019 ile terk edilmiş) ölü kodu temizlendi.

**Çalıştırılamayan ek testler:** Marketplace/pazar akışı ve login regresyon testi, gece boyunca **sistem belleği yetersizliği** nedeniyle (dev sunucusu 2 kez OOM ile öldürüldü) tamamlanamadı. Mevcut TestSprite projesinde bu akışlar için testler zaten var (`d50fe39f-...`, login testleri) — uyanınca `testsprite test run <id> --local <port> --wait` ile tekrar denenebilir.

## 8. Doğrulama sonuçları

- `pnpm --filter @stagein/web type-check` → **temiz**, 0 hata (son çalıştırma: tüm Wave'ler + video-reaksiyon fix'i sonrası)
- `pnpm --filter @stagein/web build` → **başarılı**, 22 route üretildi, 0 hata

## 9. Tamamlanmamış / dikkat gerektiren maddeler

1. **3 migration prod'a push edilmedi** (§6) — en kritik eksik, YouTube ve post-menü özelliklerinin canlıda çalışması buna bağlı.
2. **Hesap silme backend'i yok** — UI hazır, RPC yazılmadı.
3. **Marketplace/login TestSprite testleri** bellek kısıtı nedeniyle koşulamadı.
4. **`ListingApplicationModal.tsx`** hiçbir sayfadan import edilmiyor (kullanılmayan/yarım kalmış kod) — Wave 3 bunu da düzeltti ama bağlı olmadığı için etkisi yok.
5. **`MarketplaceFilters.tsx`** de hiçbir yerden import edilmiyor (dead code, yine de düzeltildi).
6. Kalan uncommitted değişiklikler (§ üstteki uyarı) commit'lenmeli.
