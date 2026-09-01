# Web anasayfa: Facebook-tarzı duvar, düzenlenebilir profil ve üst nav

- **Tarih:** 2026-09-01
- **Kapsam:** `apps/web` (mobile app aynı özellik seti için ayrı bir sonraki alt-proje olacak, bu spec'in kapsamı dışında)

## Amaç

`apps/web` şu an sadece bir pazarlama/iniş sayfası; gerçek sosyal ürün deneyimi
(video akışı, mesajlaşma, profil) `apps/mobile`'da yaşıyor. Bu iş, web'e
gerçek bir "duvar" (Facebook wall tarzı) deneyimi kazandırıyor:

- Anasayfa (`/`) artık herkese açık, gönderi paylaşılan, beğenilen ve
  yorumlanan bir akış (duvar).
- Duvardaki video gönderileri, aynı videonun zaten var olan Keşfet
  (`/kesfet`) akışıyla birebir aynı kayda karşılık gelir; bir video
  gönderisine tıklamak Instagram'daki "post → Reels" geçişi gibi
  `/kesfet`'e o videodan başlayarak zıplar.
- Kullanıcı profilleri düzenlenebilir hale gelir ve çoklu, etiketli
  link listesi (Linktree tarzı) eklenebilir.
- Üst navigasyonda sağ üstte profil fotoğrafı ikonu + yanında ayarlar
  ikonu bulunur.

## Kapsam dışı (bilinçli olarak ertelenen)

- Mevcut pazarlama içeriği (hero, özellikler, "nasıl çalışır", şehirler,
  gelir modeli, App Store/Play Store CTA'ları) **silinecek**, başka bir
  route'a taşınmayacak (kullanıcı onayı: "silinebilir şimdilik").
- Mobile app'e aynı özelliklerin taşınması — ayrı bir sonraki spec/plan.
- Post düzenleme (edit) — sadece oluşturma ve silme var, YAGNI.
- Fotoğraf lightbox / galeri görüntüleyici — basit grid yeterli.
- Takip (follow) tabanlı kişiselleştirilmiş akış — duvar tek, global,
  ters-kronolojik bir akış (mevcut Keşfet'teki "Takip" sekmesi gibi
  ayrı bir kişiselleştirme sistemi kapsam dışı).
- Bildirimler.

## Veri modeli

Yeni migration dosyaları (`supabase/migrations/013_*` vd.), mevcut
numaralandırma ve stil (RLS + `security definer` trigger fonksiyonları)
takip edilerek eklenecek.

### `posts`

```
id            uuid pk default gen_random_uuid()
user_id       uuid references users(id) on delete cascade
body          text            -- null olabilir (sadece foto/video paylaşımı)
video_id      uuid references videos(id) on delete set null  -- null olabilir
photo_urls    text[] default '{}'
like_count    integer default 0
comment_count integer default 0
created_at    timestamptz default now()
```

RLS: `select` herkese açık (`using (true)`), `insert`/`delete` sadece
`auth.uid() = user_id`.

Video gönderisi akışı: kullanıcı composer'dan video seçtiğinde önce
mevcut `videos` tablosuna normal bir satır eklenir (bkz. mevcut
`videos` şeması — `storage_path`, `city`, `instruments`, `genres`),
sonra `posts.video_id` o satıra işaret eder. Böylece video otomatik
olarak `/kesfet` akışında da (created_at sırasına göre) belirir —
ayrı bir senkronizasyon mekanizmasına gerek yok.

### `post_likes`

```
id         uuid pk default gen_random_uuid()
post_id    uuid references posts(id) on delete cascade
user_id    uuid references users(id) on delete cascade
created_at timestamptz default now()
unique (post_id, user_id)
```

RLS: `select using (true)` (mevcut kullanıcının beğenip beğenmediğini
göstermek için), `insert`/`delete` sadece `auth.uid() = user_id`.

Trigger: insert/delete sonrası `posts.like_count` günceller
(`increment_view_count` fonksiyonundakine benzer `security definer`
SQL fonksiyonu + trigger).

### `post_comments`

```
id         uuid pk default gen_random_uuid()
post_id    uuid references posts(id) on delete cascade
user_id    uuid references users(id) on delete cascade
body       text not null
created_at timestamptz default now()
```

RLS: `select using (true)`, `insert` sadece `auth.uid() = user_id`,
`delete` post sahibi veya yorum sahibi (`auth.uid() in (user_id, (select user_id from posts where id = post_id))`).

Trigger: insert/delete sonrası `posts.comment_count` günceller.

### `profile_links`

```
id         uuid pk default gen_random_uuid()
user_id    uuid references users(id) on delete cascade
label      text not null   -- örn. "Instagram", "Spotify", "Web Sitem"
url        text not null
position   integer default 0
created_at timestamptz default now()
```

RLS: `select using (true)`, `insert`/`update`/`delete` sadece
`auth.uid() = user_id`. Kaydetme stratejisi: ayarlar ekranında
"tüm listeyi değiştir" (delete-all-then-insert, tek transaction'a
gerek yok — client sırayla çağırır) yaklaşımı, karmaşık diff mantığı
gerektirmez.

### Storage

Yeni bucket `post-photos` — mevcut `listing-photos` ile birebir aynı
pattern: `public: true`, `file_size_limit: 10485760`,
`allowed_mime_types: {"image/*"}`, RLS: herkes okur, sahibi kendi
klasörüne (`auth.uid()` prefix) yükler/siler.

### Paylaşılan tipler (`packages/shared/src/types.ts`)

```ts
export interface Post {
  id: string
  user_id: string
  body: string | null
  video_id: string | null
  photo_urls: string[]
  like_count: number
  comment_count: number
  created_at: string
  user?: User
  video?: Video
  liked_by_me?: boolean   // client tarafında hesaplanır, DB kolonu değil
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  body: string
  created_at: string
  user?: User
}

export interface ProfileLink {
  id: string
  user_id: string
  label: string
  url: string
  position: number
}
```

## Sayfa yapısı / routing

### `/` — anasayfa → duvar

`apps/web/src/app/page.tsx` tamamen yeniden yazılır. Sunucu tarafında
oturumu okuyup ilk sayfayı (`getPosts(20)`) SSR ile getirir (hızlı ilk
render + SEO), sonucu `<Wall initialPosts={...} isAuthed={...} />`
client bileşenine devreder. Giriş yapmamış ziyaretçi de aynı duvarı
görür; composer/beğeni/yorum aksiyonları `/giris`'e yönlendirir.

Mevcut pazarlama içeriği (hero, `FEATURES`, `STEPS`, `REVENUE`,
`AppleMark`/`PlayMark` ikonları) tamamen kaldırılır.

### `/kesfet` — video başlangıç noktası

`KesfetPage` `searchParams`'tan `v` okuyup `VideoFeed`'e
`startVideoId` prop'u olarak geçirir. `useVideoFeed`, `startVideoId`
varsa o videoyu `getVideoById` ile ayrıca çekip ilk sayfanın başına
(varsa listeden çıkararak tekrarı önleyip) ekler — akış zaten en
üstten başladığı için ekstra scroll mantığı gerekmez.

### `/ayarlar` — yeni sayfa

Client component, `authStore.userId` yoksa `/giris`'e redirect.
İçerik mobildeki `profil/ayarlar.tsx` ile aynı alanlar + link
yönetimi:

- Avatar değiştir (mevcut `avatars` bucket'ına yükler)
- Ad soyad, bio, şehir (CITIES)
- Enstrümanlar (INSTRUMENTS, çoklu seçim), Tarzlar (GENRES, çoklu
  seçim), Deneyim seviyesi, "İşe açığım" anahtarı
- **Linkler**: ekle (etiket + URL), sırala (yukarı/aşağı ok veya
  sürükle-bırak yerine basit ok butonları — YAGNI), sil
- Kaydet (tüm alanları `users` + `musician_profiles` + `profile_links`
  tablolarına yazar, `refreshProfile()` çağırır)
- Çıkış yap

### `/profil/[username]` — güncellemeler

- Kendi profilindeyse (`authStore.profile?.username === username`)
  header'a "Profili Düzenle" butonu eklenir → `/ayarlar`.
- Yeni **Linkler** bölümü: `profile_links` pill/buton listesi olarak
  (yeni sekmede açılır, `rel="noopener noreferrer"`).
- Yeni **Gönderiler** bölümü: `getUserPosts(user.id)` ile o
  kullanıcının duvar gönderileri, `PostCard` ile render edilir
  (mevcut Videolar/İlanlar/Referanslar bölümlerinin altına eklenir).

## Bileşenler

### `components/PostComposer.tsx` (client, sadece giriş yapmışsa render)

- Otomatik büyüyen textarea + karakter sınırı yok (YAGNI)
- Fotoğraf ekle: çoklu dosya input, önizleme thumbnail'leri, tekli
  kaldırma
- Video ekle: tekli dosya input, seçilince küçük önizleme
- Gönder: fotoğrafları `post-photos` bucket'ına yükler, video varsa
  önce `videos` satırı oluşturur, sonra `posts` satırını ekler;
  başarılı olunca react-query cache'ine optimistic prepend + form
  reset

### `components/PostCard.tsx` (client)

- Üst: `UserAvatar` + ad + `@username` + görece zaman (`formatDate`
  benzeri bir `formatRelativeTime` yardımccı — `lib/site.ts`'e eklenir)
- Kendi gönderisiyse sağ üstte "..." menüsü → Sil
- Gövde: `body` varsa metin
- Fotoğraf varsa: 1 foto tam genişlik, 2-4 foto grid (basit CSS grid,
  lightbox yok)
- Video varsa: `aspect-video` önizleme kutusu, ortada play ikonu,
  `thumbnail_url` poster olarak; tamamı `Link
  href={`/kesfet?v=${video_id}`}`
- Alt: Beğen (kalp ikonu + sayaç, `liked_by_me` optimistic toggle),
  Yorum (konuşma balonu ikonu + sayaç, tıklanınca yorum bölümünü
  aç/kapa)
- Yorum bölümü (açıldığında): son birkaç yorum + "tümünü gör" + giriş
  yapmışsa yorum yazma input'u

### `components/Wall.tsx` (client)

- `PostComposer` (giriş yapmışsa) + `useWall()` ile sonsuz kaydırmalı
  `PostCard` listesi (mevcut `VideoFeed`/`useVideoFeed` intersection
  observer pattern'i tekrar kullanılır)
- İçerik yoksa / Supabase yapılandırılmamışsa `DEMO_POSTS` (yeni,
  `lib/demoContent.ts`'e eklenir — bir metin, bir foto, bir video
  post örneği; video örneği mevcut `DEMO_VIDEOS[0]`'a referans verir)

### `hooks/useWall.ts`

- `useInfiniteQuery` ile sayfalanmış post listesi (mevcut
  `useVideoFeed` pattern'i, `PAGE_SIZE = 10`)
- Mutation hook'ları: `useCreatePost`, `useTogglePostLike`,
  `useAddComment`, `useDeletePost` (react-query `useMutation` +
  optimistic cache güncellemesi)

### `lib/data.ts` eklemeleri (server-side, SSR için)

- `getPosts(limit = 20): Promise<Post[]>`
- `getUserPosts(userId: string, limit = 12): Promise<Post[]>`
- `getVideoById(id: string): Promise<Video | null>` (Keşfet
  zıplaması için)

### `lib/api.ts` (yeni, client-side browser supabase çağrıları)

Ayarlar ve composer'ın kullandığı yazma işlemleri:
`uploadAvatar`, `upsertUser`, `upsertMusicianProfile`,
`replaceProfileLinks`, `createPost`, `togglePostLike`, `addComment`,
`deletePost`.

## Auth store düzeltmesi (önkoşul)

**Mevcut hata:** `apps/web/src/components/AuthSync.tsx`, oturum
değiştiğinde yalnızca `setSession(userId)` çağırıyor — `authStore.profile`
hiçbir zaman doldurulmuyor (ikinci parametre varsayılan `null`).
Bu yüzden bugün web'de "giriş yapmış kullanıcının adı/avatarı" hiçbir
yerde gösterilemiyor.

**Düzeltme:** `stores/authStore.ts` mobile app'teki (`apps/mobile/stores/authStore.ts`)
şekle yaklaştırılır:

```ts
interface AuthState {
  userId: string | null
  profile: User | null
  musicianProfile: MusicianProfile | null
  profileLinks: ProfileLink[]
  isLoading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
  clear: () => void
}
```

`AuthSync`, `onAuthStateChange` tetiklendiğinde `userId` set eder ve
oturum varsa `refreshProfile()` çağırır (kullanıcı satırı + müzisyen
profili + linkler paralel çekilir).

## Üst navigasyon (`components/SiteHeader.tsx`)

Sağ taraftaki mevcut tekli "Giriş Yap / Uygulamaya Git" bloğu:

- **Giriş yapmışsa:** `UserAvatar` (küçük, ~36px, `/profil/[kendi
  username]`'e link) + hemen yanında dişli/ayarlar ikonu (`/ayarlar`'a
  link).
- **Giriş yapmamışsa:** mevcut "Giriş Yap" butonu aynen kalır.

`/kesfet`'te `SiteHeader` zaten gizli (immersive üst çubuk kendi
navigasyonunu taşıyor), bu değişiklikten etkilenmiyor.

## Test / doğrulama planı

- Supabase yapılandırılmamışken (`isSupabaseConfigured === false`)
  duvarın `DEMO_POSTS` ile boş görünmediğini doğrula.
- Giriş yapmış kullanıcı: post oluştur (metin, foto, video) → duvarda
  görünüyor mu, video post `/kesfet`'te de görünüyor mu.
- Duvarda bir video post'a tıkla → `/kesfet?v=<id>` doğru videodan mı
  başlıyor.
- Beğeni/yorum ekle-kaldır, sayaçların doğru güncellendiğini kontrol
  et.
- `/ayarlar`'da profil düzenle + link ekle/sil/sırala, kaydettikten
  sonra `/profil/[username]`'de doğru göründüğünü doğrula.
- Giriş yapmamış ziyaretçi: duvarı görebiliyor ama composer/beğeni/yorum
  tıklayınca `/giris`'e yönlendiriliyor mu.
- `pnpm --filter web build` ve mevcut lint/typecheck komutlarının
  geçtiğini doğrula.
