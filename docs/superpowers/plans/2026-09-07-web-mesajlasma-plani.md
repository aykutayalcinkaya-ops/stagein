# Web Mesajlaşma (DM) Özelliği — Uygulama Planı

> **Bu bir PLAN dosyasıdır, uygulama değil.** Kullanıcı "detaylı bir plan md dosyası oluştur" istedi — bu gece bu plan hayata geçirilmedi. Onay/önceliklendirme sonrası `superpowers:subagent-driven-development` ile task'lara bölünüp uygulanabilir.

**Hedef:** `apps/web`'e gerçek, çalışan bir birebir (1:1) mesajlaşma özelliği eklemek — gelen kutusu, konuşma ekranı, gerçek zamanlı bildirim, okunmamış rozetleri.

**Neden şimdi:** Web'de şu an mesajlaşma **hiç yok**. Sitede en az 4 yerde ("Mesaj at" / "Uygulamadan mesaj at" / "İletişime geç" gibi) kullanıcıyı mobil uygulamayı indirmeye yönlendiren linkler var — bu gravity.md'nin "%100 web uyumluluğu, mobil yönlendirme yasak" maddesini ihlal ediyor ve StageIn'in temel değer önerisi ("doğrudan mesajla bağlan") web'de eksik kalıyor.

---

## 0. Mevcut durum denetimi (kod okunarak doğrulandı, 2026-09-07)

### Veritabanı şeması (`supabase/migrations/005_conversations.sql`, `006_messages.sql`)

```sql
-- conversations
id uuid primary key
participant_ids uuid[] not null   -- iki (veya daha fazla) kullanıcının id'si
last_message_at timestamptz

-- messages
id uuid primary key
conversation_id uuid → conversations(id) on delete cascade
sender_id uuid → users(id)
content text
audio_url text                     -- sesli mesaj için zaten var
context_type text check (in 'video','listing','direct')
context_id uuid                    -- "bu video/ilan üzerinden başladı" bağlamı
created_at timestamptz
```

**🔴 Kritik bulgu — RLS eksik, muhtemelen mobilde de kırık:**
`conversations` tablosunda **yalnızca SELECT politikası var**:
```sql
create policy "Participants can read" on conversations for select using (auth.uid() = any(participant_ids));
```
**INSERT ve UPDATE politikası hiç yok.** RLS'de politika tanımlanmayan komut varsayılan olarak reddedilir. Ama `apps/mobile/lib/api.ts`'teki `getOrCreateConversation()` (satır 154-170) ve `touchConversation()` (172-177) tam olarak bu iki işlemi yapıyor — yani **mobil uygulamada da yeni bir konuşma başlatmak veya `last_message_at`'i güncellemek şu an muhtemelen RLS ihlaliyle başarısız oluyor** (bu gece keşfedilen `freelance_categories`/`video_source` boşluklarıyla aynı aile: migration şema+RLS'i eksik bırakılmış, client kodu daha kapsamlı davranışı varsayarak yazılmış). Bu planın Faz 1'i bu düzeltmeyi de içeriyor.

### Mobil implementasyon (referans alınacak, kopyalanmayacak — web kendi hook'larını yazacak)

- `apps/mobile/lib/api.ts`: `getOrCreateConversation(currentUserId, otherUserId)`, `touchConversation(conversationId)`
- `apps/mobile/app/(tabs)/mesajlar/[id].tsx`: konuşma ekranı var
- Web tarafında **eşdeğeri hiç yok** — `apps/web/src/lib/api.ts`'te `conversation`/`message` ile ilgili tek bir fonksiyon yok, `apps/web/src/app` altında `/mesajlar` route'u yok.

### Web'de mesajlaşmaya "gitmesi gereken ama gitmeyen" giriş noktaları (grep ile bulundu)

| Dosya | Satır | Şu anki davranış | Olması gereken |
|---|---|---|---|
| `apps/web/src/app/ilanlar/[id]/page.tsx` | ~208 | `<LinkButton href="/#indir">Uygulamadan mesaj at</LinkButton>` | İlan sahibiyle konuşma aç/oluştur |
| `apps/web/src/app/studyo/[id]/page.tsx` | ~67 | `<LinkButton href="/#indir">İletişime geç</LinkButton>` | Stüdyo sahibiyle konuşma aç |
| `apps/web/src/components/FeedVideo.tsx` | "Mesaj at" ikonu | Sadece `/profil/[username]`'e link veriyor | Video sahibiyle konuşma aç |
| `apps/mobile/lib/api.ts` referansı | — | mobilde `context_type`/`context_id` ile "bu ilan/video üzerinden" bağlamı zaten destekleniyor | Web'in de aynı `context_type`/`context_id` alanlarını doldurması gerekiyor |

---

## 1. Kapsam — Faz 1 (MVP)

- Birebir (1:1) metin mesajlaşma. Grup sohbeti, sesli mesaj gönderme (şema `audio_url`'u destekliyor ama UI'da yok), typing-indicator, okundu-bilgisi (read receipt) **kapsam dışı** (Faz 2/3, aşağıda).
- Gelen kutusu sayfası: `/mesajlar` — konuşma listesi (son mesaj önizlemesi, karşı tarafın avatarı/adı, "X dk önce", okunmamış rozeti).
- Konuşma ekranı: `/mesajlar/[id]` — mesaj balonları (gönderen/alan ayrımı), en altta composer (metin input + gönder), otomatik en alta scroll, yeni mesaj geldiğinde gerçek zamanlı güncelleme.
- Yukarıdaki tablodaki 3+ "sahte" mesaj giriş noktası gerçek konuşma başlatmaya bağlanacak.
- `SiteHeader`'a bir mesaj ikonu + okunmamış-konuşma-sayısı rozeti eklenecek (nav'da her sayfada görünür).

## 2. Veritabanı değişiklikleri (yeni migration, örn. `032_messaging_rls_and_reads.sql`)

```sql
-- Eksik INSERT/UPDATE politikaları (kök neden — bkz. §0)
create policy "Participants can create conversations" on conversations
  for insert with check (auth.uid() = any(participant_ids));

create policy "Participants can update own conversations" on conversations
  for update using (auth.uid() = any(participant_ids));

-- Okunmamış sayısı için: her katılımcının o konuşmada en son ne zaman
-- okuduğunu tutan ayrı bir tablo (conversations'a participant başına kolon
-- eklemek yerine — participant_ids bir array olduğundan per-user state için
-- ayrı tablo daha temiz):
create table conversation_reads (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
alter table conversation_reads enable row level security;
create policy "Users manage own read state" on conversation_reads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- last_message_at üzerinde index (gelen kutusu sıralaması için)
create index if not exists conversations_last_message_at_idx on conversations (last_message_at desc);
create index if not exists messages_conversation_id_created_at_idx on messages (conversation_id, created_at);
```

**Not:** Bu migration da diğer bekleyenler (`024, 028, 029, 030`) gibi gerçek DB şifresi olmadan push edilemez — uygulama zamanı geldiğinde aynı `supabase db push` adımına eklenecek.

## 3. API katmanı — `apps/web/src/lib/api.ts`'e eklenecek fonksiyonlar

```ts
// Mobildeki getOrCreateConversation ile aynı mantık, web'e taşınıyor
export async function getOrCreateConversation(
  currentUserId: string,
  otherUserId: string,
  context?: { type: 'video' | 'listing' | 'direct'; id?: string }
): Promise<Conversation>

export async function listConversations(userId: string): Promise<ConversationWithLastMessage[]>
// .contains yerine .select('*, messages(content, created_at, sender_id)') ile son mesajı da tek sorguda çekmeyi dene;
// olmuyorsa iki ayrı sorgu + client-side join.

export async function listMessages(conversationId: string, before?: string): Promise<Message[]>
// Sayfalama: `before` cursor'ı ile eski mesajlara doğru infinite scroll (yukarı kaydırınca).

export async function sendMessage(input: {
  conversationId: string
  senderId: string
  content: string
}): Promise<Message>
// Başarılı gönderimden sonra touchConversation() de çağrılmalı (aynı transaction olamaz,
// Supabase client'ta iki ayrı çağrı — sırasıyla await edilecek).

export async function touchConversation(conversationId: string): Promise<void>

export async function markConversationRead(conversationId: string, userId: string): Promise<void>
// conversation_reads tablosuna upsert.
```

## 4. React Query hook'ları — yeni `apps/web/src/hooks/useMessaging.ts`

```ts
export function useConversations() // useQuery, ['conversations', userId], listConversations
export function useConversation(conversationId: string) // useInfiniteQuery, ['messages', conversationId], listMessages (sayfalama: before cursor)
export function useSendMessage() // useMutation, optimistic append + touchConversation + invalidate ['conversations']
export function useStartConversation() // useMutation: getOrCreateConversation, başarılıysa router.push(`/mesajlar/${id}`)
export function useMarkConversationRead()
export function useUnreadConversationCount() // conversation_reads + conversations join'inden hesaplanan sayı; SiteHeader rozeti için
```

**Gerçek zamanlı güncelleme:** `apps/web/src/hooks/useRealtimeUpdates.ts`'te zaten `useWallRealtime`/`useVideoFeedRealtime` deseni var — aynı desenle `useMessagingRealtime(conversationId?: string)` eklenecek: `messages` tablosunda `conversation_id=eq.X` filtresiyle (aktif konuşma açıkken) ve/veya kullanıcının katıldığı tüm konuşmalar için genel bir `INSERT` dinleyicisi (gelen kutusu badge'i canlı güncellensin diye — Supabase Realtime bir array-contains filtresini doğrudan desteklemediğinden, muhtemelen filtresiz dinleyip client-side `participant_ids.includes(userId)` kontrolü yapmak gerekecek; alternatif: her yeni mesajda `conversations` tablosuna da bir realtime dinleyici ekleyip `last_message_at` değişimini yakalamak).

## 5. Bileşenler — yeni dosyalar

- `apps/web/src/app/mesajlar/page.tsx` — Server component, `getViewerId()` ile auth kontrolü (giriş yoksa `/giris`'e), `<ConversationList>` client component'ini render eder.
- `apps/web/src/app/mesajlar/[id]/page.tsx` — aynı auth deseni, `<MessageThread conversationId={id}>`.
- `apps/web/src/components/messaging/ConversationList.tsx` — `useConversations`, her satır `ConversationListItem`, boşsa `EmptyState` (ikon: `MessageCircle` veya `Inbox`, "Henüz mesajın yok" + "Bir müzisyene göz at" CTA'sı `/kesfet`'e).
- `apps/web/src/components/messaging/ConversationListItem.tsx` — `UserAvatar` (karşı taraf), isim, son mesaj önizlemesi (`line-clamp-1`), `formatRelativeTr`, okunmamışsa `bg-primary` nokta/rozet.
- `apps/web/src/components/messaging/MessageThread.tsx` — `useConversation` (infinite scroll yukarı), mesaj balonları (`MessageBubble`), `MessageComposer`, mount'ta ve yeni mesaj gelince `markConversationRead` çağır.
- `apps/web/src/components/messaging/MessageBubble.tsx` — gönderen/alan hizası (sağ/sol), `bg-primary`/`bg-card` ayrımı, `formatRelativeTr` zaman damgası.
- `apps/web/src/components/messaging/MessageComposer.tsx` — textarea + `Button` (gönder), Enter ile gönder / Shift+Enter yeni satır, gönderiliyor durumunda disabled.
- `apps/web/src/components/messaging/StartConversationButton.tsx` — `{ otherUserId, context? }` alan, `useStartConversation` çağırıp yönlendiren, "Mesaj At" `Button`. Bu, §0 tablosundaki 3+ sahte linkin **hepsinin** ortak, tek noktadan bakımı yapılabilir değişimi.

## 6. Var olan sahte linklerin değişimi

- `apps/web/src/app/ilanlar/[id]/page.tsx`: `<LinkButton href="/#indir">Uygulamadan mesaj at</LinkButton>` → `<StartConversationButton otherUserId={listing.user_id} context={{ type: 'listing', id: listing.id }} />`
- `apps/web/src/app/studyo/[id]/page.tsx`: `<LinkButton href="/#indir">İletişime geç</LinkButton>` → `<StartConversationButton otherUserId={studio.owner_id} />` (context tipi netleştirilmeli — stüdyo bir "listing" mi, ayrı bir varlık mı, `packages/shared/src/types.ts`'e bakılacak)
- `apps/web/src/components/FeedVideo.tsx`: "Mesaj at" `IconButton`'ının `<Link href={profil}>` içi → `<StartConversationButton otherUserId={author.id} context={{ type: 'video', id: video.id }} variant="icon" />` (IconButton'ın 44px dairesini dolduran icon-only varyant, `ReactionPicker`'a bu gece eklenen `variant="icon"` deseniyle aynı yaklaşım).
- `apps/web/src/components/SiteHeader.tsx`: nav'a mesaj ikonu + `useUnreadConversationCount()` rozeti.

## 7. UI/UX Pro Max kontrol listesi (bu özellik için)

- Mesaj balonları 44px'den küçük tıklanabilir alan içermemeli (uzun-bas/sağ-tık menüsü eklenirse — Faz 2).
- Boş gelen kutusu → gerçek `EmptyState`, asla çıplak "mesaj yok" metni değil.
- Mesaj gönderilemezse (ağ hatası) → optimistic mesajın yanında net bir "gönderilemedi, tekrar dene" göstergesi (WhatsApp/Instagram deseni), sessizce kaybolmasın.
- `prefers-reduced-motion`'a saygılı giriş animasyonu (yeni mesaj balonu fade+slide).
- Klavye ile: composer'da Enter = gönder, Escape = konuşmadan çık (mobil genişlikte tam ekran davranışı).

## 8. Faz 2 / Faz 3 (bu planın kapsamı dışı, ileride ayrı plan)

- Faz 2: Sesli mesaj kaydı/oynatma (şema zaten `audio_url` içeriyor), okundu-bilgisi ("Görüldü" ikonu), typing indicator (Supabase Presence ile), fotoğraf/dosya eki.
- Faz 3: Grup konuşmaları (`participant_ids` zaten array olduğundan şema kısmen hazır, ama UI/UX — kimin gönderdiği, grup adı/avatarı — ayrı tasarım gerektirir), engelleme/şikayet (bu gece eklenen `post_reports` deseninin mesajlaşmaya genişletilmesi), mesaj silme/düzenleme.

## 9. Açık sorular (kullanıcıya sorulmalı, bu plan varsayım yapmadı)

1. Mesajlaşma için ayrı bir bildirim/e-posta sistemi olsun mu, yoksa sadece uygulama-içi rozet mi yeterli (Faz 1 için)?
2. "İletişime geç" (stüdyo) akışı, normal DM'den farklı bir "rezervasyon talebi" şablonu mu içermeli, yoksa düz metin mesajı mı yeterli?
3. Mobil ile web arasında aynı konuşmalar/mesajlar paylaşılacak (aynı `conversations`/`messages` tablosu — evet, şema zaten paylaşımlı) ama gerçek zamanlı senkronizasyon iki platformda da aynı anda test edilmeli mi, yoksa Faz 1'de sadece web-web akışı mı doğrulanacak?

## 10. Tahmini iş büyüklüğü

- §2 (migration): küçük, ~30 dk yazım + push (DB şifresi şart).
- §3-4 (API + hook'lar): orta, ~1 gün.
- §5 (bileşenler): orta-büyük, ~1-1.5 gün (infinite scroll + realtime dahil).
- §6 (mevcut linklerin değişimi): küçük, ~2 saat.
- Toplam Faz 1: yaklaşık **2.5-3 günlük** bir tek-geliştirici tahmini; gravity.md tarzı paralel subagent dağıtımıyla (foundation → hook'lar → sayfalar/bileşenler → entegrasyon) bir gece içinde bitirilebilir, ancak migration'ın push edilmiş olması (DB şifresi) ön koşuldur — aksi halde her şey yerelde test edilip "prod'a push bekliyor" olarak bırakılır (bu gece diğer özelliklerde olduğu gibi).
