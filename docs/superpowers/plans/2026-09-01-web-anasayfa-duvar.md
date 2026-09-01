# Web Anasayfa Duvarı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `apps/web`'s home page into a Facebook-wall-style social feed (posts with text/photo/video, likes, comments), make profiles editable with a multi-link list, wire video posts to jump into the existing `/kesfet` immersive feed, and add avatar+settings icons to the top nav.

**Architecture:** Extend the existing Next.js 15 App Router web app in place, following its established conventions: server components + `lib/data.ts` for SSR reads, client components + React Query (`@tanstack/react-query`) hooks for interactive/paginated data, Zustand (`stores/authStore.ts`) for auth/profile state, and Supabase Postgres + Storage with RLS for persistence. New Postgres tables (`posts`, `post_likes`, `post_comments`, `profile_links`) and a new storage bucket (`post-photos`) are added via numbered migrations matching the existing `supabase/migrations/00N_*.sql` style.

**Tech Stack:** Next.js 15 (App Router, React 19), TypeScript, Tailwind CSS v4, `@tanstack/react-query` v5, Zustand v5, `@supabase/ssr` + `@supabase/supabase-js`, Supabase Postgres/Storage/Auth.

**Spec:** `docs/superpowers/specs/2026-09-01-web-anasayfa-duvar-design.md`

## Global Constraints

- Scope is `apps/web` only. Mobile (`apps/mobile`) is a separate future project — do not touch it.
- No unit/integration test framework exists in this repo (`apps/web/package.json` has no `test` script, no jest/vitest/playwright). Verification per task is: `pnpm --filter web type-check`, `pnpm --filter web lint`, and a concrete manual check via `pnpm --filter web dev` in a browser. Do not introduce a test framework as part of this work — out of scope.
- Turkish UI copy throughout, matching existing tone (see `apps/web/src/app/page.tsx`, `apps/web/src/components/*` for examples).
- Follow existing conventions exactly: `'use client'` directives, `cn()` helper from `components/ui.tsx`, `UserAvatar` for all avatars, `formatRelative`/`formatDate` from `lib/site.ts`, the `isSupabaseConfigured` guard + demo-content-fallback pattern from `hooks/useVideoFeed.ts` / `lib/demoContent.ts`.
- No post editing (create + delete only). No photo lightbox. No follow-based personalized feed — the wall is one global reverse-chronological feed.
- Existing marketing landing content (hero, features, "nasıl çalışır", şehirler, gelir modeli, App Store/Play Store CTAs) is deleted, not moved.
- **Database migrations touch a linked remote Supabase project** (`supabase/.temp/linked-project.json` shows this repo is already linked). Never run `supabase db push` without first telling the user exactly which migration file(s) are about to be applied and getting explicit confirmation — this is a shared, hard-to-reverse action.
- A user can be authenticated (`auth.uid()` exists) but have no row in `public.users` yet (onboarding is currently completed in the mobile app only). Every new web feature that assumes a profile row exists must check `authStore.profile` (not just `authStore.userId`) and degrade gracefully (hide the control, or show a short explanatory message) when `profile` is null.

---

### Task 1: Database migration — `posts`, `post_likes`, `post_comments`

**Files:**
- Create: `supabase/migrations/013_posts.sql`

**Interfaces:**
- Produces: Postgres tables `posts(id, user_id, body, video_id, photo_urls, like_count, comment_count, created_at)`, `post_likes(id, post_id, user_id, created_at)`, `post_comments(id, post_id, user_id, body, created_at)`, all with RLS enabled. `posts.like_count`/`posts.comment_count` are auto-maintained by triggers.

- [ ] **Step 1: Write the migration file**

```sql
-- Migration: 013_posts.sql
-- Created: 2026-09-01

create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  body text,
  video_id uuid references videos(id) on delete set null,
  photo_urls text[] default '{}',
  like_count integer default 0,
  comment_count integer default 0,
  created_at timestamptz default now()
);

alter table posts enable row level security;

create policy "Anyone can view posts" on posts for select using (true);
create policy "Owner can insert posts" on posts for insert with check (auth.uid() = user_id);
create policy "Owner can delete posts" on posts for delete using (auth.uid() = user_id);

create table post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

alter table post_likes enable row level security;

create policy "Anyone can view post likes" on post_likes for select using (true);
create policy "Owner can insert post likes" on post_likes for insert with check (auth.uid() = user_id);
create policy "Owner can delete post likes" on post_likes for delete using (auth.uid() = user_id);

create table post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

alter table post_comments enable row level security;

create policy "Anyone can view post comments" on post_comments for select using (true);
create policy "Owner can insert post comments" on post_comments for insert with check (auth.uid() = user_id);
create policy "Author or post owner can delete comment" on post_comments for delete using (
  auth.uid() = user_id or auth.uid() = (select user_id from posts where id = post_id)
);

-- like_count maintenance

create or replace function update_post_like_count()
returns trigger language plpgsql security definer as $$
begin
  if (TG_OP = 'INSERT') then
    update posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger post_likes_count_insert
  after insert on post_likes
  for each row execute function update_post_like_count();

create trigger post_likes_count_delete
  after delete on post_likes
  for each row execute function update_post_like_count();

-- comment_count maintenance

create or replace function update_post_comment_count()
returns trigger language plpgsql security definer as $$
begin
  if (TG_OP = 'INSERT') then
    update posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger post_comments_count_insert
  after insert on post_comments
  for each row execute function update_post_comment_count();

create trigger post_comments_count_delete
  after delete on post_comments
  for each row execute function update_post_comment_count();
```

- [ ] **Step 2: Validate SQL syntax without applying**

Run from the `supabase/` directory: `supabase db push --dry-run`
Expected: the dry run lists `013_posts.sql` as a pending migration with no syntax errors reported.

- [ ] **Step 3: Ask the user to confirm, then apply**

Tell the user exactly which file is about to be pushed (`013_posts.sql`, creating `posts`/`post_likes`/`post_comments`) and which project it targets (the linked project in `supabase/.temp/linked-project.json`). Only after explicit confirmation, run:

`supabase db push`

Expected: migration applies with no errors; `supabase migration list` shows `013_posts` as applied both locally and on the remote.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/013_posts.sql
git commit -m "feat(db): add posts, post_likes, post_comments tables"
```

---

### Task 2: Database migration — `profile_links`

**Files:**
- Create: `supabase/migrations/014_profile_links.sql`

**Interfaces:**
- Produces: Postgres table `profile_links(id, user_id, label, url, position, created_at)` with RLS.

- [ ] **Step 1: Write the migration file**

```sql
-- Migration: 014_profile_links.sql
-- Created: 2026-09-01

create table profile_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  label text not null,
  url text not null,
  position integer default 0,
  created_at timestamptz default now()
);

alter table profile_links enable row level security;

create policy "Anyone can view profile links" on profile_links for select using (true);
create policy "Owner can insert profile links" on profile_links for insert with check (auth.uid() = user_id);
create policy "Owner can update profile links" on profile_links for update using (auth.uid() = user_id);
create policy "Owner can delete profile links" on profile_links for delete using (auth.uid() = user_id);
```

- [ ] **Step 2: Validate SQL syntax without applying**

Run: `supabase db push --dry-run`
Expected: `014_profile_links.sql` listed as pending, no errors.

- [ ] **Step 3: Confirm with the user, then apply**

Same confirmation flow as Task 1, Step 3, naming `014_profile_links.sql`. Then run `supabase db push`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/014_profile_links.sql
git commit -m "feat(db): add profile_links table"
```

---

### Task 3: Storage migration — `post-photos` bucket

**Files:**
- Create: `supabase/migrations/015_storage_post_photos.sql`

**Interfaces:**
- Produces: public storage bucket `post-photos` (10MB limit, `image/*`), with the same folder-owned RLS pattern as the existing `listing-photos` bucket (`supabase/migrations/012_storage.sql`).

- [ ] **Step 1: Write the migration file**

```sql
-- Migration: 015_storage_post_photos.sql
-- Created: 2026-09-01

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-photos', 'post-photos', true, 10485760, '{"image/*"}')
on conflict (id) do nothing;

create policy "Public read post-photos" on storage.objects
  for select using (bucket_id = 'post-photos');

create policy "Authenticated upload post-photos" on storage.objects
  for insert with check (bucket_id = 'post-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "User delete own post-photos" on storage.objects
  for delete using (bucket_id = 'post-photos' and auth.uid()::text = (storage.foldername(name))[1]);
```

- [ ] **Step 2: Validate SQL syntax without applying**

Run: `supabase db push --dry-run`
Expected: `015_storage_post_photos.sql` listed as pending, no errors.

- [ ] **Step 3: Confirm with the user, then apply**

Same confirmation flow, naming `015_storage_post_photos.sql`. Then run `supabase db push`.

- [ ] **Step 4: Verify the bucket exists**

In the Supabase dashboard (Storage) or via `supabase storage ls`, confirm a `post-photos` bucket is listed.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/015_storage_post_photos.sql
git commit -m "feat(db): add post-photos storage bucket"
```

---

### Task 4: Shared types — `Post`, `PostComment`, `ProfileLink`

**Files:**
- Modify: `packages/shared/src/types.ts`

**Interfaces:**
- Produces: exported TypeScript interfaces `Post`, `PostComment`, `ProfileLink`, importable from `@stagein/shared` (re-exported via `packages/shared/src/index.ts`'s existing `export * from './types'`).

- [ ] **Step 1: Append the new interfaces**

Add at the end of `packages/shared/src/types.ts`:

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
  liked_by_me?: boolean
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

- [ ] **Step 2: Type-check the shared package**

Run: `pnpm --filter @stagein/shared type-check`
Expected: PASS, no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types.ts
git commit -m "feat(shared): add Post, PostComment, ProfileLink types"
```

---

### Task 5: Auth store fix — actually populate `profile`

**Files:**
- Create: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/stores/authStore.ts`
- Modify: `apps/web/src/components/AuthSync.tsx`

**Interfaces:**
- Consumes: `Post`/`PostComment`/`ProfileLink`/`User`/`MusicianProfile` from `@stagein/shared` (Task 4); `createClient` from `apps/web/src/lib/supabase/client.ts`.
- Produces: `fetchProfileBundle(userId: string): Promise<{ profile: User | null; musicianProfile: MusicianProfile | null; profileLinks: ProfileLink[] }>` in `lib/api.ts`. `useAuthStore` gains `musicianProfile: MusicianProfile | null`, `profileLinks: ProfileLink[]`, and `setProfileData(data: { profile: User | null; musicianProfile: MusicianProfile | null; profileLinks: ProfileLink[] }): void`. Every later task that needs the current user's profile reads `useAuthStore((s) => s.profile)`.

**Why this task exists:** today `AuthSync.tsx` calls `setSession(userId)` with no second argument, so `authStore.profile` is `null` forever — nothing on the web app can currently show "who am I" (name/avatar). This is a prerequisite for the top-nav avatar, the composer, and `/ayarlar`.

- [ ] **Step 1: Create `lib/api.ts` with `fetchProfileBundle`**

```ts
'use client'

import type { MusicianProfile, ProfileLink, User } from '@stagein/shared'
import { createClient } from './supabase/client'

export const USER_SELECT = 'id, username, full_name, avatar_url, city, role, bio, email, created_at'

export interface ProfileBundle {
  profile: User | null
  musicianProfile: MusicianProfile | null
  profileLinks: ProfileLink[]
}

export async function fetchProfileBundle(userId: string): Promise<ProfileBundle> {
  const supabase = createClient()
  const [{ data: profile }, { data: musicianProfile }, { data: profileLinks }] = await Promise.all([
    supabase.from('users').select(USER_SELECT).eq('id', userId).maybeSingle(),
    supabase.from('musician_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('profile_links').select('*').eq('user_id', userId).order('position', { ascending: true }),
  ])

  return {
    profile: (profile as User) ?? null,
    musicianProfile: (musicianProfile as MusicianProfile) ?? null,
    profileLinks: (profileLinks as ProfileLink[]) ?? [],
  }
}
```

- [ ] **Step 2: Extend `authStore.ts`**

Replace the full contents of `apps/web/src/stores/authStore.ts`:

```ts
import { create } from 'zustand'
import type { MusicianProfile, ProfileLink, User } from '@stagein/shared'

interface AuthState {
  /** Supabase auth kullanıcı id'si — oturum yoksa null */
  userId: string | null
  profile: User | null
  musicianProfile: MusicianProfile | null
  profileLinks: ProfileLink[]
  isLoading: boolean
  setSession: (userId: string | null) => void
  setProfileData: (data: { profile: User | null; musicianProfile: MusicianProfile | null; profileLinks: ProfileLink[] }) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  profile: null,
  musicianProfile: null,
  profileLinks: [],
  isLoading: true,
  setSession: (userId) => set({ userId, isLoading: false }),
  setProfileData: (data) => set(data),
  clear: () => set({ userId: null, profile: null, musicianProfile: null, profileLinks: [], isLoading: false }),
}))
```

- [ ] **Step 3: Wire `refreshProfile` into `AuthSync.tsx`**

Replace the full contents of `apps/web/src/components/AuthSync.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { fetchProfileBundle } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

/** Supabase oturumunu ve profil verisini Zustand store'una bağlar. Layout içinde bir kez render edilir. */
export function AuthSync() {
  const setSession = useAuthStore((s) => s.setSession)
  const setProfileData = useAuthStore((s) => s.setProfileData)
  const clear = useAuthStore((s) => s.clear)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null)
      return
    }

    const supabase = createClient()

    async function sync(userId: string | null) {
      setSession(userId)
      if (!userId) {
        clear()
        return
      }
      const bundle = await fetchProfileBundle(userId)
      setProfileData(bundle)
    }

    supabase.auth.getUser().then(({ data }) => sync(data.user?.id ?? null))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void sync(session?.user?.id ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [setSession, setProfileData, clear])

  return null
}
```

- [ ] **Step 4: Type-check and lint**

Run: `pnpm --filter web type-check && pnpm --filter web lint`
Expected: PASS, no errors.

- [ ] **Step 5: Manual verification**

Run `pnpm --filter web dev`, log in with a test account that has a `public.users` row (or via the Google/email flow used before), open the browser console, and run `useAuthStore.getState()` is not accessible from console directly — instead temporarily confirm by checking the Network tab shows requests to `users`, `musician_profiles`, and `profile_links` right after login completes.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/stores/authStore.ts apps/web/src/components/AuthSync.tsx
git commit -m "fix(web): populate authStore.profile via AuthSync"
```

---

### Task 6: Server data helpers + demo content for the wall

**Files:**
- Modify: `apps/web/src/lib/data.ts`
- Modify: `apps/web/src/lib/demoContent.ts`

**Interfaces:**
- Consumes: `Post`, `Video` from `@stagein/shared`; existing `USER_SELECT`, `createClient`, `isSupabaseConfigured` from `apps/web/src/lib/data.ts`.
- Produces: `getPosts(limit?: number, viewerId?: string): Promise<Post[]>`, `getUserPosts(userId: string, limit?: number): Promise<Post[]>`, `getVideoById(id: string): Promise<Video | null>`, `getViewerId(): Promise<string | null>` in `lib/data.ts`. `DEMO_POSTS: Post[]` in `lib/demoContent.ts`.

- [ ] **Step 1: Add post/video helpers to `lib/data.ts`**

Add `Post` to the type import at the top of the file (change `import type { Endorsement, Listing, ListingType, MarketplaceItem, MusicianProfile, User, Video } from '@stagein/shared'` to also include `Post`), then append these functions at the end of `apps/web/src/lib/data.ts`:

```ts
const POST_SELECT = `*, user:users(${USER_SELECT}), video:videos(*)`

export async function getPosts(limit = 20, viewerId?: string): Promise<Post[]> {
  if (!isSupabaseConfigured) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  const posts = (data ?? []) as Post[]
  return attachLikedByMe(posts, viewerId, supabase)
}

export async function getUserPosts(userId: string, limit = 12): Promise<Post[]> {
  if (!isSupabaseConfigured) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data ?? []) as Post[]
}

export async function getVideoById(id: string): Promise<Video | null> {
  if (!isSupabaseConfigured) return null
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('videos')
    .select('*, user:users(id, username, full_name, avatar_url, city)')
    .eq('id', id)
    .maybeSingle()
  if (error) return null
  return (data as Video) ?? null
}

export async function getViewerId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

async function attachLikedByMe(
  posts: Post[],
  viewerId: string | undefined,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Post[]> {
  if (!viewerId || posts.length === 0) return posts
  const { data } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', viewerId)
    .in(
      'post_id',
      posts.map((p) => p.id)
    )
  const likedIds = new Set((data ?? []).map((row) => row.post_id as string))
  return posts.map((p) => ({ ...p, liked_by_me: likedIds.has(p.id) }))
}
```

- [ ] **Step 2: Add `DEMO_POSTS` to `lib/demoContent.ts`**

Add `import type { Post } from '@stagein/shared'` to the top imports (alongside the existing `Video` import), then append at the end of `apps/web/src/lib/demoContent.ts`:

```ts
/**
 * Örnek duvar içeriği — canlı projede henüz gerçek gönderi yokken duvarın
 * boş görünmemesi için kullanılır. `useWall` gerçek veri boşsa buna düşer.
 */
export const DEMO_POSTS: Post[] = [
  {
    id: 'demo-post-1',
    user_id: 'demo-user-1',
    body: 'Yeni prova kaydı geldi, dinleyin 🎸',
    video_id: 'demo-guitarist',
    photo_urls: [],
    like_count: 24,
    comment_count: 3,
    created_at: new Date().toISOString(),
    user: DEMO_VIDEOS[0].user,
    video: DEMO_VIDEOS[0],
    liked_by_me: false,
  },
  {
    id: 'demo-post-2',
    user_id: 'demo-user-2',
    body: 'Bu akşam stüdyoda çekilenler 📸',
    video_id: null,
    photo_urls: ['/demo/avatars/singer.png'],
    like_count: 12,
    comment_count: 1,
    created_at: new Date(Date.now() - 3_600_000).toISOString(),
    user: DEMO_VIDEOS[1].user,
    liked_by_me: false,
  },
  {
    id: 'demo-post-3',
    user_id: 'demo-user-3',
    body: 'Yeni grup arkadaşı arıyorum, DM atın.',
    video_id: null,
    photo_urls: [],
    like_count: 5,
    comment_count: 0,
    created_at: new Date(Date.now() - 7_200_000).toISOString(),
    user: DEMO_VIDEOS[2].user,
    liked_by_me: false,
  },
]
```

- [ ] **Step 3: Type-check and lint**

Run: `pnpm --filter web type-check && pnpm --filter web lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/data.ts apps/web/src/lib/demoContent.ts
git commit -m "feat(web): add post/video data helpers and demo wall content"
```

---

### Task 7: Wall shell — `PostCard`, `Wall`, replace the home page

**Files:**
- Create: `apps/web/src/components/PostCard.tsx`
- Create: `apps/web/src/hooks/useWall.ts`
- Create: `apps/web/src/components/Wall.tsx`
- Modify: `apps/web/src/app/page.tsx` (full rewrite)
- Delete: `apps/web/src/components/PhoneMockup.tsx` (only consumer was the old `page.tsx`)

**Interfaces:**
- Consumes: `Post` from `@stagein/shared`; `getPosts`, `getViewerId` from `lib/data.ts` (Task 6); `DEMO_POSTS` from `lib/demoContent.ts` (Task 6); `UserAvatar` from `components/UserAvatar.tsx`; `formatRelative` from `lib/site.ts`; `EmptyState`, `cn` from `components/ui.tsx`.
- Produces: `PostCard({ post }: { post: Post })`, `useWall(initialPosts?: Post[])` returning a React Query `useInfiniteQuery` result over pages of `Post[]`, `Wall({ initialPosts }: { initialPosts: Post[] })`. Later tasks extend all three.

- [ ] **Step 1: Create the display-only `PostCard`**

```tsx
'use client'

import Link from 'next/link'
import type { Post } from '@stagein/shared'
import { formatRelative } from '@/lib/site'
import { UserAvatar } from './UserAvatar'

export function PostCard({ post }: { post: Post }) {
  const author = post.user

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <header className="flex items-center gap-3">
        {author ? (
          <Link href={`/profil/${author.username}`} className="flex items-center gap-3">
            <UserAvatar name={author.full_name} username={author.username} url={author.avatar_url} size={44} />
            <span>
              <span className="block text-sm font-bold text-text">{author.full_name ?? author.username}</span>
              <span className="block text-xs text-muted">{formatRelative(post.created_at)}</span>
            </span>
          </Link>
        ) : null}
      </header>

      {post.body ? (
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-text-secondary">{post.body}</p>
      ) : null}

      {post.photo_urls.length > 0 ? (
        <div
          className={`mt-4 grid gap-1.5 overflow-hidden rounded-xl ${
            post.photo_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}
        >
          {post.photo_urls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" className="aspect-square w-full object-cover" />
          ))}
        </div>
      ) : null}

      <footer className="mt-4 flex items-center gap-5 border-t border-border pt-3 text-sm text-muted">
        <span>{post.like_count} beğeni</span>
        <span>{post.comment_count} yorum</span>
      </footer>
    </article>
  )
}
```

- [ ] **Step 2: Create `useWall`**

```ts
'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import type { Post } from '@stagein/shared'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { useAuthStore } from '@/stores/authStore'
import { DEMO_POSTS } from '@/lib/demoContent'

const PAGE_SIZE = 10
const POST_SELECT =
  'id, user_id, body, video_id, photo_urls, like_count, comment_count, created_at, user:users(id, username, full_name, avatar_url, city), video:videos(*)'

async function fetchPostsPage(pageParam: number, viewerId: string | null): Promise<Post[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .order('created_at', { ascending: false })
    .range(pageParam, pageParam + PAGE_SIZE - 1)
  if (error) throw error
  const posts = (data ?? []) as Post[]

  if (!viewerId || posts.length === 0) return posts

  const { data: likes } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', viewerId)
    .in(
      'post_id',
      posts.map((p) => p.id)
    )
  const likedIds = new Set((likes ?? []).map((row) => row.post_id as string))
  return posts.map((p) => ({ ...p, liked_by_me: likedIds.has(p.id) }))
}

export function useWall(initialPosts: Post[] = []) {
  const userId = useAuthStore((s) => s.userId)

  return useInfiniteQuery({
    queryKey: ['wall'],
    initialPageParam: 0,
    initialData: initialPosts.length ? { pages: [initialPosts], pageParams: [0] } : undefined,
    queryFn: async ({ pageParam }) => {
      if (!isSupabaseConfigured) return pageParam === 0 ? DEMO_POSTS : []
      const rows = await fetchPostsPage(pageParam, userId)
      if (rows.length === 0 && pageParam === 0) return DEMO_POSTS
      return rows
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.reduce((sum, p) => sum + p.length, 0),
  })
}
```

- [ ] **Step 3: Create `Wall`**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import type { Post } from '@stagein/shared'
import { useWall } from '@/hooks/useWall'
import { PostCard } from './PostCard'
import { EmptyState } from './ui'

export function Wall({ initialPosts }: { initialPosts: Post[] }) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useWall(initialPosts)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage()
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const posts = data?.pages.flat() ?? []

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      {isLoading ? (
        <p className="py-16 text-center text-sm text-muted">Duvar yükleniyor…</p>
      ) : isError ? (
        <EmptyState title="Duvar yüklenemedi" description="Bağlantını kontrol edip tekrar dene." />
      ) : posts.length === 0 ? (
        <EmptyState title="Henüz gönderi yok" description="İlk gönderiyi sen paylaş." />
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          <div ref={sentinelRef} className="h-px w-full" />
          {isFetchingNextPage ? <p className="py-4 text-center text-xs text-muted">Yükleniyor…</p> : null}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Rewrite `app/page.tsx`**

Replace the entire contents of `apps/web/src/app/page.tsx` with:

```tsx
import type { Metadata } from 'next'
import { Wall } from '@/components/Wall'
import { getPosts, getViewerId } from '@/lib/data'

export const metadata: Metadata = {
  title: 'StageIn — Müzisyenlerin Platformu',
  description: 'Şehrindeki müzisyenlerin paylaştığı gönderiler, videolar ve duyurular.',
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const viewerId = await getViewerId()
  const initialPosts = await getPosts(20, viewerId ?? undefined)
  return <Wall initialPosts={initialPosts} />
}
```

- [ ] **Step 5: Delete the now-unused `PhoneMockup` component**

```bash
git rm apps/web/src/components/PhoneMockup.tsx
```

- [ ] **Step 6: Type-check, lint, build**

Run: `pnpm --filter web type-check && pnpm --filter web lint && pnpm --filter web build`
Expected: PASS. If `build` fails on an unrelated pre-existing issue in the working tree, note it but do not fix unrelated files as part of this task.

- [ ] **Step 7: Manual verification**

Run `pnpm --filter web dev`, open `http://localhost:3000/`. Expected: no hero/App Store CTA content; instead either the 3 `DEMO_POSTS` (if Supabase has no `posts` rows yet) or real posts, each showing author, body/photos, and beğeni/yorum counts.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/PostCard.tsx apps/web/src/hooks/useWall.ts apps/web/src/components/Wall.tsx apps/web/src/app/page.tsx
git commit -m "feat(web): replace marketing home page with post wall"
```

---

### Task 8: Post composer — text + photo

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/hooks/useWall.ts`
- Create: `apps/web/src/components/PostComposer.tsx`
- Modify: `apps/web/src/components/Wall.tsx`

**Interfaces:**
- Consumes: `Post` from `@stagein/shared`; `USER_SELECT` from `lib/api.ts` (Task 5); `useAuthStore` (Task 5); `Button` from `components/ui.tsx`; `UserAvatar`.
- Produces: `CreatePostInput { userId: string; body: string | null; photoFiles: File[] }`, `createPost(input: CreatePostInput): Promise<Post>`, `uploadPostPhoto(userId: string, file: File): Promise<string>` in `lib/api.ts`. `useCreatePost()` in `hooks/useWall.ts` (a `useMutation` wrapper). `PostComposer()` component with no props.

- [ ] **Step 1: Add post-creation functions to `lib/api.ts`**

Append to `apps/web/src/lib/api.ts` (add `Post` to the `@stagein/shared` type import):

```ts
export async function uploadPostPhoto(userId: string, file: File): Promise<string> {
  const supabase = createClient()
  const path = `${userId}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('post-photos').upload(path, file)
  if (error) throw error
  return supabase.storage.from('post-photos').getPublicUrl(path).data.publicUrl
}

const POST_SELECT = `*, user:users(${USER_SELECT}), video:videos(*)`

export interface CreatePostInput {
  userId: string
  body: string | null
  photoFiles: File[]
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const supabase = createClient()
  const photoUrls = await Promise.all(input.photoFiles.map((file) => uploadPostPhoto(input.userId, file)))

  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: input.userId, body: input.body, photo_urls: photoUrls })
    .select(POST_SELECT)
    .single()
  if (error) throw error
  return { ...(data as Post), liked_by_me: false }
}
```

- [ ] **Step 2: Add `useCreatePost` to `hooks/useWall.ts`**

Add these imports to the top of `apps/web/src/hooks/useWall.ts`: `useMutation, useQueryClient` from `@tanstack/react-query`, and `createPost, type CreatePostInput` from `@/lib/api`. Then append:

```ts
export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePostInput) => createPost(input),
    onSuccess: (post) => {
      queryClient.setQueryData<{ pages: Post[][]; pageParams: number[] }>(['wall'], (current) => {
        if (!current) return { pages: [[post]], pageParams: [0] }
        return { ...current, pages: [[post, ...current.pages[0]], ...current.pages.slice(1)] }
      })
    },
  })
}
```

- [ ] **Step 3: Create `PostComposer`**

```tsx
'use client'

import { useState, type FormEvent } from 'react'
import { useCreatePost } from '@/hooks/useWall'
import { useAuthStore } from '@/stores/authStore'
import { UserAvatar } from './UserAvatar'
import { Button } from './ui'

export function PostComposer() {
  const profile = useAuthStore((s) => s.profile)
  const { mutate, isPending } = useCreatePost()
  const [body, setBody] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])

  if (!profile) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!body.trim() && photoFiles.length === 0) return
    mutate(
      { userId: profile!.id, body: body.trim() || null, photoFiles },
      { onSuccess: () => { setBody(''); setPhotoFiles([]) } }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5">
      <div className="flex gap-3">
        <UserAvatar name={profile.full_name} username={profile.username} url={profile.avatar_url} size={40} />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Aklından ne geçiyor?"
          rows={2}
          className="min-h-[44px] flex-1 resize-none bg-transparent text-[15px] text-text outline-none placeholder:text-muted"
        />
      </div>

      {photoFiles.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {photoFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotoFiles((files) => files.filter((_, i) => i !== index))}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <label className="cursor-pointer text-sm font-medium text-text-secondary hover:text-white">
          📷 Fotoğraf
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => setPhotoFiles((files) => [...files, ...Array.from(e.target.files ?? [])])}
          />
        </label>
        <Button type="submit" disabled={isPending || (!body.trim() && photoFiles.length === 0)}>
          {isPending ? 'Paylaşılıyor…' : 'Paylaş'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Wire `PostComposer` into `Wall`**

In `apps/web/src/components/Wall.tsx`, add the import `import { PostComposer } from './PostComposer'` and render it above the posts list, inside the wrapping `<div>`, before the `{isLoading ? ... }` block:

```tsx
      <PostComposer />
```

- [ ] **Step 5: Type-check, lint**

Run: `pnpm --filter web type-check && pnpm --filter web lint`
Expected: PASS.

- [ ] **Step 6: Manual verification**

With `pnpm --filter web dev` running and logged in as a user with a `public.users` row, go to `/`, type text into the composer, attach 1-2 photos, click Paylaş. Expected: the new post appears at the top of the wall immediately with the photo(s) rendered, and a row appears in the `posts` table (check via Supabase Studio) with matching `photo_urls`.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/hooks/useWall.ts apps/web/src/components/PostComposer.tsx apps/web/src/components/Wall.tsx
git commit -m "feat(web): add text/photo post composer"
```

---

### Task 9: Video posts + Keşfet hand-off

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/components/PostComposer.tsx`
- Modify: `apps/web/src/components/PostCard.tsx`

**Interfaces:**
- Consumes: existing `videos` table schema (`storage_path` required, rest nullable) from `supabase/migrations/003_videos.sql`.
- Produces: `createVideoFromFile(userId: string, file: File): Promise<string>` (returns the new video's id) in `lib/api.ts`; `CreatePostInput` gains `videoFile: File | null`; `createPost` creates the `videos` row first when `videoFile` is present and sets `posts.video_id`. `PostCard` renders a clickable video preview linking to `/kesfet?v=<video_id>`.

- [ ] **Step 1: Add `createVideoFromFile` and extend `createPost` in `lib/api.ts`**

Add this function above `createPost` in `apps/web/src/lib/api.ts`:

```ts
export async function createVideoFromFile(userId: string, file: File): Promise<string> {
  const supabase = createClient()
  const path = `${userId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('videos').upload(path, file)
  if (uploadError) throw uploadError

  const { data, error } = await supabase.from('videos').insert({ user_id: userId, storage_path: path }).select('id').single()
  if (error) throw error
  return (data as { id: string }).id
}
```

Replace the `CreatePostInput` interface and `createPost` function with:

```ts
export interface CreatePostInput {
  userId: string
  body: string | null
  photoFiles: File[]
  videoFile: File | null
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const supabase = createClient()
  const photoUrls = await Promise.all(input.photoFiles.map((file) => uploadPostPhoto(input.userId, file)))
  const videoId = input.videoFile ? await createVideoFromFile(input.userId, input.videoFile) : null

  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: input.userId, body: input.body, photo_urls: photoUrls, video_id: videoId })
    .select(POST_SELECT)
    .single()
  if (error) throw error
  return { ...(data as Post), liked_by_me: false }
}
```

- [ ] **Step 2: Add a video picker to `PostComposer`**

In `apps/web/src/components/PostComposer.tsx`, add `const [videoFile, setVideoFile] = useState<File | null>(null)` next to the existing `photoFiles` state. Update the `mutate(...)` call in `handleSubmit` to pass `videoFile` alongside the other fields, and clear it in `onSuccess`:

```tsx
    mutate(
      { userId: profile!.id, body: body.trim() || null, photoFiles, videoFile },
      { onSuccess: () => { setBody(''); setPhotoFiles([]); setVideoFile(null) } }
    )
```

Also update the submit-disabled condition to `isPending || (!body.trim() && photoFiles.length === 0 && !videoFile)`.

Add a video preview block right after the photo-preview block (before the `<div className="mt-3 flex items-center justify-between ...">` footer):

```tsx
      {videoFile ? (
        <div className="relative mt-3 h-28 w-full overflow-hidden rounded-lg border border-border bg-black">
          <video src={URL.createObjectURL(videoFile)} className="h-full w-full object-contain" muted />
          <button
            type="button"
            onClick={() => setVideoFile(null)}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white"
          >
            ×
          </button>
        </div>
      ) : null}
```

Add a video-attach label next to the photo label in the footer `<div>`:

```tsx
        <label className="cursor-pointer text-sm font-medium text-text-secondary hover:text-white">
          🎬 Video
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
          />
        </label>
```

- [ ] **Step 3: Render the video block in `PostCard`**

In `apps/web/src/components/PostCard.tsx`, add the `import Link from 'next/link'` (already present) and insert this block after the photo-grid block, before the `<footer>`:

```tsx
      {post.video ? (
        <Link
          href={`/kesfet?v=${post.video.id}`}
          className="relative mt-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-black"
        >
          {post.video.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.video.thumbnail_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
          ) : null}
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-dark">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </Link>
      ) : null}
```

- [ ] **Step 4: Type-check, lint**

Run: `pnpm --filter web type-check && pnpm --filter web lint`
Expected: PASS.

- [ ] **Step 5: Manual verification**

Attach a short video file in the composer and submit. Expected: (a) a new row appears in `videos` with `storage_path` pointing at the uploaded file, (b) the wall post shows a black video-preview box with a play icon, (c) clicking it navigates to `/kesfet?v=<that video's id>` (the query param will not yet change the feed order until Task 10 — confirm the URL and that `/kesfet` still loads without erroring).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/components/PostComposer.tsx apps/web/src/components/PostCard.tsx
git commit -m "feat(web): support video posts, linking through to Keşfet"
```

---

### Task 10: Keşfet deep link (`?v=`) — jump straight to a video

**Files:**
- Modify: `apps/web/src/hooks/useVideoFeed.ts`
- Modify: `apps/web/src/components/VideoFeed.tsx`
- Modify: `apps/web/src/app/kesfet/page.tsx`

**Interfaces:**
- Consumes: `getVideoById` from `lib/data.ts` (Task 6).
- Produces: `useVideoFeed(city?: string, startVideoId?: string)`; `VideoFeed({ startVideoId }: { startVideoId?: string })`.

- [ ] **Step 1: Extend `useVideoFeed` to prioritize a starting video**

Replace the full contents of `apps/web/src/hooks/useVideoFeed.ts`:

```ts
'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import type { Video } from '@stagein/shared'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { DEMO_VIDEOS } from '@/lib/demoContent'

const PAGE_SIZE = 10

async function fetchStartVideo(id: string): Promise<Video | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('videos')
    .select('*, user:users(id, username, full_name, avatar_url, city)')
    .eq('id', id)
    .maybeSingle()
  if (error) return null
  return (data as Video) ?? null
}

export function useVideoFeed(city?: string, startVideoId?: string) {
  return useInfiniteQuery({
    queryKey: ['feed', city ?? 'all', startVideoId ?? 'none'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!isSupabaseConfigured) return pageParam === 0 ? DEMO_VIDEOS : []
      const supabase = createClient()

      let query = supabase
        .from('videos')
        .select('*, user:users(id, username, full_name, avatar_url, city)')
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1)

      if (city) query = query.eq('city', city)

      const { data, error } = await query
      if (error) throw error
      let rows = (data ?? []) as Video[]

      // Henüz gerçek içerik yoksa (yeni proje) örnek videolarla akışı doldur.
      if (rows.length === 0 && pageParam === 0) {
        rows = city ? DEMO_VIDEOS.filter((v) => v.city === city) : DEMO_VIDEOS
      }

      if (pageParam === 0 && startVideoId) {
        const startVideo = startVideoId.startsWith('demo-')
          ? DEMO_VIDEOS.find((v) => v.id === startVideoId) ?? null
          : await fetchStartVideo(startVideoId)
        if (startVideo) {
          rows = [startVideo, ...rows.filter((v) => v.id !== startVideo.id)]
        }
      }

      return rows
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.reduce((sum, p) => sum + p.length, 0),
  })
}
```

- [ ] **Step 2: Accept `startVideoId` in `VideoFeed`**

In `apps/web/src/components/VideoFeed.tsx`, change the component signature and the hook call:

```tsx
export function VideoFeed({ startVideoId }: { startVideoId?: string }) {
  const [city, setCity] = useState<string>('')
  const [tab, setTab] = useState<'kesfet' | 'takip'>('kesfet')
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useVideoFeed(
    city || undefined,
    startVideoId
  )
```

(The rest of the component is unchanged.)

- [ ] **Step 3: Read `v` from `searchParams` in the page**

Replace the full contents of `apps/web/src/app/kesfet/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { VideoFeed } from '@/components/VideoFeed'

export const metadata: Metadata = {
  title: 'Keşfet',
  description: 'Şehrindeki müzisyenlerin performans videoları.',
  robots: { index: false },
}

interface PageProps {
  searchParams: Promise<{ v?: string }>
}

export default async function KesfetPage({ searchParams }: PageProps) {
  const { v } = await searchParams
  return <VideoFeed startVideoId={v} />
}
```

- [ ] **Step 4: Type-check, lint, build**

Run: `pnpm --filter web type-check && pnpm --filter web lint && pnpm --filter web build`
Expected: PASS.

- [ ] **Step 5: Manual verification**

From the wall, click a video post created in Task 9. Expected: `/kesfet?v=<id>` loads with that exact video as the first (and initially visible) item in the immersive feed. Also visit `/kesfet` directly (no `v` param) and confirm the normal feed still works unchanged.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/hooks/useVideoFeed.ts apps/web/src/components/VideoFeed.tsx apps/web/src/app/kesfet/page.tsx
git commit -m "feat(web): jump Keşfet to a specific video via ?v= param"
```

---

### Task 11: Like a post

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/hooks/useWall.ts`
- Modify: `apps/web/src/components/PostCard.tsx`

**Interfaces:**
- Produces: `togglePostLike(postId: string, userId: string, like: boolean): Promise<void>` in `lib/api.ts`; `useTogglePostLike()` mutation hook in `hooks/useWall.ts`.

- [ ] **Step 1: Add `togglePostLike` to `lib/api.ts`**

```ts
export async function togglePostLike(postId: string, userId: string, like: boolean): Promise<void> {
  const supabase = createClient()
  if (like) {
    const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
    if (error) throw error
  } else {
    const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    if (error) throw error
  }
}
```

- [ ] **Step 2: Add `useTogglePostLike` to `hooks/useWall.ts`**

Add `togglePostLike` to the `@/lib/api` import, then append:

```ts
export function useTogglePostLike() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: async ({ postId, like }: { postId: string; like: boolean }) => {
      if (!userId) throw new Error('Giriş yapmalısın')
      await togglePostLike(postId, userId, like)
    },
    onMutate: async ({ postId, like }) => {
      queryClient.setQueryData<{ pages: Post[][]; pageParams: number[] }>(['wall'], (current) => {
        if (!current) return current
        return {
          ...current,
          pages: current.pages.map((page) =>
            page.map((p) => (p.id === postId ? { ...p, liked_by_me: like, like_count: p.like_count + (like ? 1 : -1) } : p))
          ),
        }
      })
    },
  })
}
```

- [ ] **Step 3: Make the beğeni count in `PostCard` interactive**

In `apps/web/src/components/PostCard.tsx`, add these imports: `Link` (already present), `useAuthStore` from `@/stores/authStore`, `useTogglePostLike` from `@/hooks/useWall`, `cn` from `./ui`. Replace the `<footer>` block with:

```tsx
      <footer className="mt-4 flex items-center gap-5 border-t border-border pt-3 text-sm">
        {userId ? (
          <button
            type="button"
            onClick={() => toggleLike({ postId: post.id, like: !post.liked_by_me })}
            className={cn('flex items-center gap-1.5 font-medium', post.liked_by_me ? 'text-accent' : 'text-muted hover:text-white')}
          >
            <svg
              viewBox="0 0 24 24"
              fill={post.liked_by_me ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={post.liked_by_me ? 0 : 1.8}
              className="h-4 w-4"
            >
              <path d="M12 21s-6.7-4.3-9.3-8.1C.8 10 1.4 6.4 4.4 4.8c2.1-1.1 4.6-.6 6.1 1.2.4.5.7.9 1.5.9.8 0 1.1-.4 1.5-.9 1.5-1.8 4-2.3 6.1-1.2 3 1.6 3.6 5.2 1.7 8.1C18.7 16.7 12 21 12 21Z" />
            </svg>
            {post.like_count} beğeni
          </button>
        ) : (
          <Link href="/giris" className="flex items-center gap-1.5 text-muted hover:text-white">
            {post.like_count} beğeni
          </Link>
        )}
        <span className="text-muted">{post.comment_count} yorum</span>
      </footer>
```

And add inside the component body, before the `return`:

```tsx
  const userId = useAuthStore((s) => s.userId)
  const { mutate: toggleLike } = useTogglePostLike()
```

- [ ] **Step 4: Type-check, lint**

Run: `pnpm --filter web type-check && pnpm --filter web lint`
Expected: PASS.

- [ ] **Step 5: Manual verification**

While logged in, click the beğeni control on a post. Expected: the count increments immediately and the icon fills; clicking again decrements and un-fills. Refresh the page — the liked state persists (confirms it round-tripped through `post_likes` and `attachLikedByMe`/`fetchPostsPage`). Log out and confirm the control becomes a plain link to `/giris`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/hooks/useWall.ts apps/web/src/components/PostCard.tsx
git commit -m "feat(web): add post like/unlike"
```

---

### Task 12: Comment on a post

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/hooks/useWall.ts`
- Modify: `apps/web/src/components/PostCard.tsx`

**Interfaces:**
- Produces: `addComment(postId: string, userId: string, body: string): Promise<PostComment>`, `getPostComments(postId: string): Promise<PostComment[]>` in `lib/api.ts`; `useAddComment()` mutation hook in `hooks/useWall.ts`.

- [ ] **Step 1: Add comment functions to `lib/api.ts`**

Add `PostComment` to the `@stagein/shared` type import, then append:

```ts
export async function addComment(postId: string, userId: string, body: string): Promise<PostComment> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: userId, body })
    .select(`*, user:users(${USER_SELECT})`)
    .single()
  if (error) throw error
  return data as PostComment
}

export async function getPostComments(postId: string): Promise<PostComment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_comments')
    .select(`*, user:users(${USER_SELECT})`)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as PostComment[]
}
```

- [ ] **Step 2: Add `useAddComment` to `hooks/useWall.ts`**

Add `addComment` to the `@/lib/api` import and `PostComment` to the `@stagein/shared` type import at the top of `apps/web/src/hooks/useWall.ts`, then append:

```ts
export function useAddComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { postId: string; userId: string; body: string }) =>
      addComment(input.postId, input.userId, input.body),
    onSuccess: (_comment, variables) => {
      queryClient.setQueryData<{ pages: Post[][]; pageParams: number[] }>(['wall'], (current) => {
        if (!current) return current
        return {
          ...current,
          pages: current.pages.map((page) =>
            page.map((p) => (p.id === variables.postId ? { ...p, comment_count: p.comment_count + 1 } : p))
          ),
        }
      })
    },
  })
}
```

- [ ] **Step 3: Add a comment section to `PostCard`**

In `apps/web/src/components/PostCard.tsx`, add imports: `useState` from `react`, `useQuery` from `@tanstack/react-query`, `getPostComments` from `@/lib/api`, `useAddComment` from `@/hooks/useWall`, `formatRelative` (already imported).

Add local state and the query, inside the component body:

```tsx
  const [commentsOpen, setCommentsOpen] = useState(false)
  const { data: comments } = useQuery({
    queryKey: ['post-comments', post.id],
    queryFn: () => getPostComments(post.id),
    enabled: commentsOpen,
  })
  const { mutate: addPostComment, isPending: isCommenting } = useAddComment()
  const [commentBody, setCommentBody] = useState('')
```

Replace the `<span className="text-muted">{post.comment_count} yorum</span>` line in the footer with a toggle button:

```tsx
        <button type="button" onClick={() => setCommentsOpen((v) => !v)} className="text-muted hover:text-white">
          {post.comment_count} yorum
        </button>
```

After the `</footer>` closing tag, add the expandable comments block:

```tsx
      {commentsOpen ? (
        <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
          {(comments ?? []).map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <UserAvatar
                name={comment.user?.full_name}
                username={comment.user?.username}
                url={comment.user?.avatar_url}
                size={28}
              />
              <div className="rounded-lg bg-surface px-3 py-2 text-sm">
                <span className="font-semibold text-text">{comment.user?.full_name ?? comment.user?.username}</span>{' '}
                <span className="text-text-secondary">{comment.body}</span>
                <div className="mt-1 text-[11px] text-muted">{formatRelative(comment.created_at)}</div>
              </div>
            </div>
          ))}

          {userId ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!commentBody.trim()) return
                addPostComment(
                  { postId: post.id, userId, body: commentBody.trim() },
                  { onSuccess: () => setCommentBody('') }
                )
              }}
            >
              <input
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Yorum yaz…"
                className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text outline-none placeholder:text-muted"
              />
              <button type="submit" disabled={isCommenting || !commentBody.trim()} className="text-sm font-semibold text-primary disabled:opacity-50">
                Gönder
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
```

- [ ] **Step 4: Type-check, lint**

Run: `pnpm --filter web type-check && pnpm --filter web lint`
Expected: PASS.

- [ ] **Step 5: Manual verification**

Click "N yorum" on a post. Expected: the section expands (empty initially), typing a comment and submitting appends it to the list and increments the counter in the footer without a full page reload. Reopen after collapsing/reopening — the new comment is still there (confirms it persisted to `post_comments`).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/hooks/useWall.ts apps/web/src/components/PostCard.tsx
git commit -m "feat(web): add post comments"
```

---

### Task 13: Delete own post

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/hooks/useWall.ts`
- Modify: `apps/web/src/components/PostCard.tsx`

**Interfaces:**
- Produces: `deletePost(postId: string): Promise<void>` in `lib/api.ts`; `useDeletePost()` mutation hook in `hooks/useWall.ts`.

- [ ] **Step 1: Add `deletePost` to `lib/api.ts`**

```ts
export async function deletePost(postId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
}
```

- [ ] **Step 2: Add `useDeletePost` to `hooks/useWall.ts`**

Add `deletePost` to the `@/lib/api` import, then append:

```ts
export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: (_data, postId) => {
      queryClient.setQueryData<{ pages: Post[][]; pageParams: number[] }>(['wall'], (current) => {
        if (!current) return current
        return { ...current, pages: current.pages.map((page) => page.filter((p) => p.id !== postId)) }
      })
    },
  })
}
```

- [ ] **Step 3: Add a delete control to `PostCard`**

In `apps/web/src/components/PostCard.tsx`, add `useDeletePost` to the `@/hooks/useWall` import, and inside the component body:

```tsx
  const { mutate: removePost } = useDeletePost()
  const isOwner = userId === post.user_id
```

Change the `<header>` to a flex row with the delete control on the right:

```tsx
      <header className="flex items-center justify-between gap-3">
        {author ? (
          <Link href={`/profil/${author.username}`} className="flex items-center gap-3">
            <UserAvatar name={author.full_name} username={author.username} url={author.avatar_url} size={44} />
            <span>
              <span className="block text-sm font-bold text-text">{author.full_name ?? author.username}</span>
              <span className="block text-xs text-muted">{formatRelative(post.created_at)}</span>
            </span>
          </Link>
        ) : null}
        {isOwner ? (
          <button
            type="button"
            onClick={() => { if (window.confirm('Bu gönderiyi silmek istediğine emin misin?')) removePost(post.id) }}
            className="text-xs font-medium text-muted hover:text-accent"
          >
            Sil
          </button>
        ) : null}
      </header>
```

- [ ] **Step 4: Type-check, lint**

Run: `pnpm --filter web type-check && pnpm --filter web lint`
Expected: PASS.

- [ ] **Step 5: Manual verification**

On your own post, click Sil, confirm the dialog. Expected: the post disappears from the wall immediately; refreshing confirms it stays gone (deleted from `posts`, and its comments/likes cascade-deleted per the FK `on delete cascade`). Confirm the Sil button does not appear on other users' posts.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/hooks/useWall.ts apps/web/src/components/PostCard.tsx
git commit -m "feat(web): allow deleting your own post"
```

---

### Task 14: `/ayarlar` — profile edit page

**Files:**
- Create: `apps/web/src/app/ayarlar/page.tsx`
- Modify: `apps/web/src/lib/api.ts`

**Interfaces:**
- Consumes: `CITIES`, `INSTRUMENTS`, `GENRES`, `ExperienceLevel` from `@stagein/shared`; `EXPERIENCE_LABELS` from `lib/site.ts`; `Chip` from `components/ui.tsx`; `useAuthStore` (Task 5).
- Produces: `uploadAvatar(userId: string, file: File): Promise<string>`, `upsertUser(input: { id: string; full_name: string | null; bio: string | null; city: string | null; avatar_url: string | null }): Promise<void>`, `upsertMusicianProfile(input: { user_id: string; instruments: string[]; genres: string[]; experience_level: ExperienceLevel; is_open_to_gig: boolean }): Promise<void>` in `lib/api.ts`. Route `/ayarlar`.

- [ ] **Step 1: Add profile-write functions to `lib/api.ts`**

Add `ExperienceLevel` to the `@stagein/shared` type import, then append:

```ts
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient()
  const path = `${userId}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

export async function upsertUser(input: {
  id: string
  full_name: string | null
  bio: string | null
  city: string | null
  avatar_url: string | null
}): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('users').update(input).eq('id', input.id)
  if (error) throw error
}

export async function upsertMusicianProfile(input: {
  user_id: string
  instruments: string[]
  genres: string[]
  experience_level: ExperienceLevel
  is_open_to_gig: boolean
}): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('musician_profiles').upsert(input)
  if (error) throw error
}
```

- [ ] **Step 2: Create the `/ayarlar` page**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CITIES, GENRES, INSTRUMENTS } from '@stagein/shared'
import type { ExperienceLevel } from '@stagein/shared'
import { createClient } from '@/lib/supabase/client'
import { uploadAvatar, upsertMusicianProfile, upsertUser } from '@/lib/api'
import { EXPERIENCE_LABELS } from '@/lib/site'
import { Button, Chip, EmptyState } from '@/components/ui'
import { UserAvatar } from '@/components/UserAvatar'
import { useAuthStore } from '@/stores/authStore'

const LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'professional']

export default function AyarlarPage() {
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const profile = useAuthStore((s) => s.profile)
  const musicianProfile = useAuthStore((s) => s.musicianProfile)
  const setProfileData = useAuthStore((s) => s.setProfileData)
  const profileLinks = useAuthStore((s) => s.profileLinks)

  useEffect(() => {
    if (userId === null) router.replace('/giris')
  }, [userId, router])

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [city, setCity] = useState<string | null>(profile?.city ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [instruments, setInstruments] = useState<string[]>(musicianProfile?.instruments ?? [])
  const [genres, setGenres] = useState<string[]>(musicianProfile?.genres ?? [])
  const [experience, setExperience] = useState<ExperienceLevel>(musicianProfile?.experience_level ?? 'beginner')
  const [openToGig, setOpenToGig] = useState(musicianProfile?.is_open_to_gig ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(list: string[], setList: (next: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  if (userId && !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title="Hesabın henüz tamamlanmamış"
          description="Profilini tamamlamak için StageIn mobil uygulamasını kullan."
        />
      </div>
    )
  }

  if (!profile) return null

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const avatarUrl = avatarFile ? await uploadAvatar(profile!.id, avatarFile) : profile!.avatar_url
      await upsertUser({
        id: profile!.id,
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        city,
        avatar_url: avatarUrl,
      })
      await upsertMusicianProfile({
        user_id: profile!.id,
        instruments,
        genres,
        experience_level: experience,
        is_open_to_gig: openToGig,
      })
      setProfileData({
        profile: { ...profile!, full_name: fullName.trim() || null, bio: bio.trim() || null, city, avatar_url: avatarUrl },
        musicianProfile: { user_id: profile!.id, instruments, genres, experience_level: experience, is_open_to_gig: openToGig },
        profileLinks,
      })
      router.push(`/profil/${profile!.username}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.push('/')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight">Ayarlar</h1>

      <div className="mt-8 flex flex-col items-center gap-3">
        <label className="cursor-pointer">
          <UserAvatar
            url={avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url}
            name={fullName || profile.username}
            size={88}
          />
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
        </label>
        <span className="text-sm font-semibold text-primary">Fotoğrafı değiştir</span>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ad Soyad"
          className="rounded-lg border border-border bg-card px-4 py-3 text-text outline-none placeholder:text-muted focus:border-primary"
        />
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Kendinden bahset — ne çalıyorsun, nerede çaldın?"
          rows={4}
          className="rounded-lg border border-border bg-card px-4 py-3 text-text outline-none placeholder:text-muted focus:border-primary"
        />
      </div>

      <Section title="Şehir">
        {CITIES.map((option) => (
          <Chip key={option} tone={city === option ? 'primary' : 'default'} className="cursor-pointer" >
            <button type="button" onClick={() => setCity(city === option ? null : option)}>{option}</button>
          </Chip>
        ))}
      </Section>

      <Section title="Enstrüman">
        {INSTRUMENTS.map((option) => (
          <Chip key={option} tone={instruments.includes(option) ? 'primary' : 'default'}>
            <button type="button" onClick={() => toggle(instruments, setInstruments, option)}>{option}</button>
          </Chip>
        ))}
      </Section>

      <Section title="Tarz">
        {GENRES.map((option) => (
          <Chip key={option} tone={genres.includes(option) ? 'primary' : 'default'}>
            <button type="button" onClick={() => toggle(genres, setGenres, option)}>{option}</button>
          </Chip>
        ))}
      </Section>

      <Section title="Seviye">
        {LEVELS.map((option) => (
          <Chip key={option} tone={experience === option ? 'primary' : 'default'}>
            <button type="button" onClick={() => setExperience(option)}>{EXPERIENCE_LABELS[option]}</button>
          </Chip>
        ))}
      </Section>

      <label className="mt-6 flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <span className="text-sm font-semibold text-text">İşe açığım</span>
        <input type="checkbox" checked={openToGig} onChange={(e) => setOpenToGig(e.target.checked)} className="h-5 w-5" />
      </label>

      {error ? <p className="mt-4 text-sm text-accent">{error}</p> : null}

      <div className="mt-8 flex items-center justify-between">
        <button type="button" onClick={handleSignOut} className="text-sm font-semibold text-accent">
          Çıkış yap
        </button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
```

Note: `Chip` in `components/ui.tsx` currently renders a `<span>` with plain text children — wrapping a `<button>` inside it works because `Chip` just renders `children` inside the span (see `apps/web/src/components/ui.tsx`), no change to `ui.tsx` needed.

- [ ] **Step 3: Type-check, lint**

Run: `pnpm --filter web type-check && pnpm --filter web lint`
Expected: PASS.

- [ ] **Step 4: Manual verification**

Visit `/ayarlar` while logged out → redirected to `/giris`. While logged in with a completed profile: change name/bio/city/avatar/instruments/genres/level/switch, click Kaydet. Expected: redirected to `/profil/<username>`, and the changes are visible there. Click Çıkış yap → redirected to `/` and the top-nav reverts to the logged-out state (verified fully once Task 17 lands).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/ayarlar/page.tsx apps/web/src/lib/api.ts
git commit -m "feat(web): add /ayarlar profile edit page"
```

---

### Task 15: Profile links manager in `/ayarlar`

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/app/ayarlar/page.tsx`

**Interfaces:**
- Produces: `replaceProfileLinks(userId: string, links: { label: string; url: string }[]): Promise<void>` in `lib/api.ts`.

- [ ] **Step 1: Add `replaceProfileLinks` to `lib/api.ts`**

```ts
export async function replaceProfileLinks(userId: string, links: { label: string; url: string }[]): Promise<void> {
  const supabase = createClient()
  const { error: deleteError } = await supabase.from('profile_links').delete().eq('user_id', userId)
  if (deleteError) throw deleteError
  if (links.length === 0) return
  const rows = links.map((link, index) => ({ user_id: userId, label: link.label, url: link.url, position: index }))
  const { error: insertError } = await supabase.from('profile_links').insert(rows)
  if (insertError) throw insertError
}
```

- [ ] **Step 2: Add a links editor to `/ayarlar`**

In `apps/web/src/app/ayarlar/page.tsx`, add `replaceProfileLinks` to the `@/lib/api` import. Add local state near the other `useState` calls:

```tsx
  const [links, setLinks] = useState(profileLinks.map((l) => ({ label: l.label, url: l.url })))
  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')

  function addLink() {
    if (!newLabel.trim() || !newUrl.trim()) return
    setLinks((current) => [...current, { label: newLabel.trim(), url: newUrl.trim() }])
    setNewLabel('')
    setNewUrl('')
  }

  function removeLink(index: number) {
    setLinks((current) => current.filter((_, i) => i !== index))
  }

  function moveLink(index: number, direction: -1 | 1) {
    setLinks((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }
```

In `handleSave`, after the `await upsertMusicianProfile(...)` call, add:

```tsx
      await replaceProfileLinks(profile!.id, links)
```

And update the `setProfileData(...)` call's `profileLinks` field from `profileLinks` to a freshly-shaped array:

```tsx
        profileLinks: links.map((link, index) => ({ id: `${profile!.id}-${index}`, user_id: profile!.id, label: link.label, url: link.url, position: index })),
```

Add a new `<Section title="Linkler">` block right before the "İşe açığım" `<label>`:

```tsx
      <div className="mt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Linkler</p>
        <div className="flex flex-col gap-2">
          {links.map((link, index) => (
            <div key={`${link.url}-${index}`} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <span className="flex-1 truncate text-sm">
                <span className="font-semibold text-text">{link.label}</span>{' '}
                <span className="text-muted">{link.url}</span>
              </span>
              <button type="button" onClick={() => moveLink(index, -1)} disabled={index === 0} className="text-muted disabled:opacity-30">
                ↑
              </button>
              <button type="button" onClick={() => moveLink(index, 1)} disabled={index === links.length - 1} className="text-muted disabled:opacity-30">
                ↓
              </button>
              <button type="button" onClick={() => removeLink(index)} className="text-accent">
                Sil
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Etiket (örn. Instagram)"
            className="w-1/3 rounded-lg border border-border bg-card px-3 py-2 text-sm text-text outline-none placeholder:text-muted"
          />
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://…"
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-text outline-none placeholder:text-muted"
          />
          <button type="button" onClick={addLink} className="text-sm font-semibold text-primary">
            Ekle
          </button>
        </div>
      </div>
```

- [ ] **Step 3: Type-check, lint**

Run: `pnpm --filter web type-check && pnpm --filter web lint`
Expected: PASS.

- [ ] **Step 4: Manual verification**

In `/ayarlar`, add 3 links, reorder with ↑/↓, remove one, save. Expected: `profile_links` table now has exactly the remaining 2 rows with `position` matching the on-screen order (check in Supabase Studio).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/app/ayarlar/page.tsx
git commit -m "feat(web): manage profile links in /ayarlar"
```

---

### Task 16: Profile page — edit button, links, and own posts

**Files:**
- Create: `apps/web/src/components/ProfileLinkList.tsx`
- Modify: `apps/web/src/app/profil/[username]/page.tsx`
- Modify: `apps/web/src/lib/data.ts`

**Interfaces:**
- Consumes: `getUserPosts` from `lib/data.ts` (Task 6); `ProfileLink` from `@stagein/shared`; `useAuthStore` (client-side check for "is this my profile" needs a client wrapper since the page itself is a server component — see Step 2).
- Produces: `ProfileLinkList({ links }: { links: ProfileLink[] })`; `getProfileLinks(userId: string): Promise<ProfileLink[]>` in `lib/data.ts`.

- [ ] **Step 1: Add `getProfileLinks` to `lib/data.ts`**

```ts
export async function getProfileLinks(userId: string): Promise<ProfileLink[]> {
  if (!isSupabaseConfigured) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profile_links')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true })
  if (error) return []
  return (data ?? []) as ProfileLink[]
}
```

Add `ProfileLink` to the `@stagein/shared` type import at the top of `apps/web/src/lib/data.ts`.

- [ ] **Step 2: Create `ProfileLinkList`**

```tsx
'use client'

import type { ProfileLink } from '@stagein/shared'

export function ProfileLinkList({ links }: { links: ProfileLink[] }) {
  if (links.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold tracking-tight">Linkler</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:border-primary hover:text-white"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire "Profili Düzenle", links, and gönderiler into the profile page**

In `apps/web/src/app/profil/[username]/page.tsx`:

- Add imports: `ProfileLinkList` from `@/components/ProfileLinkList`, `PostCard` from `@/components/PostCard`, `getProfileLinks, getUserPosts` (add to the existing `@/lib/data` import).
- In `ProfilPage`, extend the `Promise.all` to also fetch links and posts:

```tsx
  const [profile, videos, listings, endorsements, links, posts] = await Promise.all([
    getMusicianProfile(user.id),
    getUserVideos(user.id),
    getUserListings(user.id),
    getEndorsements(user.id),
    getProfileLinks(user.id),
    getUserPosts(user.id),
  ])
```

- Replace the `<LinkButton href="/#indir">Mesaj at</LinkButton>` header action with a client-side own-profile check. `ProfilPage` is a server component (it does `await Promise.all([...])` for data fetching), so the check can't live inline with a top-level `'use client'` directive — it needs its own small client component file instead.

- [ ] **Step 3a: Create `components/ProfileHeaderActions.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { LinkButton } from './ui'

export function ProfileHeaderActions({ username }: { username: string }) {
  const myUsername = useAuthStore((s) => s.profile?.username)

  if (myUsername === username) {
    return <LinkButton href="/ayarlar">Profili Düzenle</LinkButton>
  }

  return <LinkButton href="/giris">Mesaj at</LinkButton>
}
```

- [ ] **Step 3b: Use it in the profile page, and add Linkler + Gönderiler sections**

In `apps/web/src/app/profil/[username]/page.tsx`, import `ProfileHeaderActions` from `@/components/ProfileHeaderActions` and replace:

```tsx
        <LinkButton href="/#indir">Mesaj at</LinkButton>
```

with:

```tsx
        <ProfileHeaderActions username={user.username} />
```

Add `<ProfileLinkList links={links} />` right after the closing `</header>` tag (before the bio paragraph).

Add a "Gönderiler" section after the closing `</section>` of the existing "Videolar" section:

```tsx
      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight">Gönderiler</h2>
        {posts.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="Henüz gönderi yok" description="Bu müzisyen henüz duvarda paylaşım yapmamış." />
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
```

- [ ] **Step 4: Type-check, lint, build**

Run: `pnpm --filter web type-check && pnpm --filter web lint && pnpm --filter web build`
Expected: PASS.

- [ ] **Step 5: Manual verification**

Visit your own `/profil/<your username>` → header shows "Profili Düzenle" linking to `/ayarlar`; any links you saved in Task 15 appear as pills; your wall posts appear under "Gönderiler" with working like/comment controls (same `PostCard` as the home wall). Visit someone else's profile → header shows "Mesaj at" (to `/giris` since in-app messaging is out of scope here), no edit button.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/ProfileLinkList.tsx apps/web/src/components/ProfileHeaderActions.tsx apps/web/src/app/profil/\[username\]/page.tsx apps/web/src/lib/data.ts
git commit -m "feat(web): show profile links, own-posts, and edit-profile entry point"
```

---

### Task 17: Top nav — avatar + settings icons

**Files:**
- Modify: `apps/web/src/components/SiteHeader.tsx`

**Interfaces:**
- Consumes: `useAuthStore` (`profile`) (Task 5); `UserAvatar`.

- [ ] **Step 1: Replace the right-side auth block**

In `apps/web/src/components/SiteHeader.tsx`, add `import { UserAvatar } from './UserAvatar'`. Replace:

```tsx
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={userId ? '/kesfet' : '/giris'}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_var(--color-primary)] transition-all duration-180 ease-out hover:bg-primary-dim active:scale-[0.97]"
          >
            {userId ? 'Uygulamaya Git' : 'Giriş Yap'}
          </Link>
        </div>
```

with:

```tsx
        <div className="hidden items-center gap-3 md:flex">
          {profile ? (
            <>
              <Link href={`/profil/${profile.username}`} aria-label="Profilim">
                <UserAvatar name={profile.full_name} username={profile.username} url={profile.avatar_url} size={36} />
              </Link>
              <Link
                href="/ayarlar"
                aria-label="Ayarlar"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-text-secondary hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </Link>
            </>
          ) : (
            <Link
              href="/giris"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_var(--color-primary)] transition-all duration-180 ease-out hover:bg-primary-dim active:scale-[0.97]"
            >
              Giriş Yap
            </Link>
          )}
        </div>
```

Add `const profile = useAuthStore((s) => s.profile)` next to the existing `const userId = useAuthStore((s) => s.userId)` line.

- [ ] **Step 2: Type-check, lint, build**

Run: `pnpm --filter web type-check && pnpm --filter web lint && pnpm --filter web build`
Expected: PASS.

- [ ] **Step 3: Manual verification**

Logged out: header shows "Giriş Yap". Logged in with a completed profile: header shows your avatar (linking to your `/profil/<username>`) and a gear icon next to it (linking to `/ayarlar`). Confirm `/kesfet` still hides the header entirely (unrelated to this change, just a regression check).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/SiteHeader.tsx
git commit -m "feat(web): add avatar and settings icons to top nav"
```

---

## Self-Review Notes

- **Spec coverage:** every section of `docs/superpowers/specs/2026-09-01-web-anasayfa-duvar-design.md` maps to a task — data model → Tasks 1-3, types → Task 4, anasayfa/duvar → Tasks 6-13, Keşfet deep link → Task 10, `/ayarlar` → Tasks 14-15, profil page → Task 16, top nav → Task 17, auth store fix → Task 5.
- **Type consistency:** `Post`, `PostComment`, `ProfileLink` (Task 4) are used with identical field names across `lib/data.ts`, `lib/api.ts`, `hooks/useWall.ts`, `components/PostCard.tsx`/`Wall.tsx`/`PostComposer.tsx` throughout. `CreatePostInput` is introduced in Task 8 without `videoFile` and extended in Task 9 — both versions shown in full so there's no ambiguity about the final shape. `useAuthStore`'s `setProfileData` shape (Task 5) is reused as-is in Task 14/15.
- **No follow-based feed, no post editing, no lightbox** — confirmed absent from every task.
