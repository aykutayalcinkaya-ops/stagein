# Testing & Verification — Emoji Reactions, Threaded Comments, Shares, Realtime

Phase 9 / Task 8. This plan was written by reading the actual code in this
repo (migrations, `lib/api.ts`, hooks, components) on 2026-09-04, not from
the feature spec alone. **Read Section 0 before running anything** — several
of the checks a generic test plan would ask for cannot pass yet because the
UI layer hasn't caught up with the data layer.

---

## 0. Current implementation status (read first)

Tasks 1–6 shipped the **database + data-access layer** for multi-emoji
reactions, threaded comment replies, and shares. They did **not** wire any
of it into the actual UI, and they left the old single-`like` UI in a
broken state. Concretely:

| Feature | DB (migration) | `lib/api.ts` | React Query hook | Wired into UI | Realtime |
|---|---|---|---|---|---|
| Post reactions (6 emoji) | ✅ `018_post_reactions.sql` | ✅ `addPostReaction`/`removePostReaction`/`getPostUserReaction` | ✅ `useTogglePostReaction` (`apps/web/src/hooks/usePostReactions.ts`) | ❌ `PostCard.tsx` still renders a single 👍-only button bound to the **old** `useTogglePostLike`/`post_likes` path | Hook exists (`useWallRealtime`) but is **never called** anywhere |
| Video reactions (6 emoji) | ✅ `019_video_reactions.sql` | ✅ `addVideoReaction`/`removeVideoReaction`/`getVideoUserReaction` | ✅ `useVideoToggleReaction` | ❌ `FeedVideo.tsx` still renders a single 👍-only button bound to the **old** `useToggleVideoLike`/`video_likes` path | Hook exists (`useVideoFeedRealtime`) but is **never called** anywhere |
| Threaded comment replies | ✅ `020_comment_replies.sql` (adds `post_comments.reply_count`) | ✅ `addCommentReply`/`getCommentReplies`/`deleteCommentReply` | ✅ `useCommentReplies`/`useAddCommentReply` (`apps/web/src/hooks/useCommentReplies.ts`); **no delete hook** wraps `deleteCommentReply` | ❌ `PostCard.tsx` renders only flat top-level comments; no "N cevap" button, no reply composer, no owner badge | n/a — no subscription for replies exists at all |
| Post shares (repost to wall) | ✅ `021_post_shares.sql` | ✅ `addPostShare`/`removePostShare`/`hasUserSharedPost` | ✅ `usePostShareStatus`/`useTogglePostShare` (`apps/web/src/hooks/usePostShares.ts`) | ❌ No share button/menu exists anywhere in the app | No subscription for `post_shares` |
| Video shares | ✅ `022_video_shares.sql` | ✅ `addVideoShare`/`removeVideoShare` | ❌ **No hook file exists** for video shares at all | ❌ Not wired | — |
| Legacy like → reaction data migration | ✅ `023_migrate_likes_to_reactions.sql` (backfills `post_likes`/`video_likes` into `*_reactions` as `'like'`, idempotent, keeps old tables for audit) | — | — | — | — |

**Known break caused by this gap:** migrations `018`/`019` **drop**
`posts.like_count` and `videos.like_count` (superseded by the `reactions`
jsonb column), but `PostCard.tsx`, `FeedVideo.tsx`,
`apps/web/src/hooks/useWall.ts`, `apps/web/src/hooks/useVideoFeed.ts`,
`apps/web/src/lib/demoContent.ts`, and
`apps/web/src/app/profil/[username]/page.tsx` still read/write
`post.like_count` / `video.like_count`. Against a migrated database this
renders `NaN`/`undefined beğeni` in the like counter today, and it is a
confirmed, reproducible `tsc` error (see §6).

**What this means for testing:**
- **Sections 1–2** (database triggers/RLS and API/hook contracts) are
  testable **today**, independent of the UI, and should be run first.
- **Section 3** (the one UI interaction that exists today — single-like +
  flat comments) is testable today **only after** the `like_count` bug is
  fixed, or against a database that hasn't run migration 018/019's column
  drop.
- **Section 4** is the full UI checklist from the original feature spec
  (emoji picker, reply threads, share menu, live 2-tab sync). It is written
  out in full so it becomes the acceptance checklist the moment someone
  wires `PostCard`/`FeedVideo` up to the reaction/reply/share hooks and
  mounts `useWallRealtime`/`useVideoFeedRealtime` — **do not execute it
  against the current build**, every step in it will fail for lack of UI,
  not because of a bug.
- **Section 6** (type-check/build/lint) reflects the actual `tsc --noEmit`
  output captured on 2026-09-04 — use it as the "known baseline" to diff
  against after any fix.

---

## 1. Database-level verification (run now, via Supabase SQL editor or `psql`)

Prerequisite: migrations up through `023_migrate_likes_to_reactions.sql`
applied to the target database, and at least one test user + one test post
with a top-level comment.

### 1.1 Post reactions (`post_reactions`, trigger `update_post_reactions_count`)
- [ ] `insert into post_reactions (post_id, user_id, reaction_type) values ('<post>', '<user>', 'like');`
      → `posts.reactions` for that row becomes `{"like": 1}` (trigger `post_reactions_count_change`).
- [ ] Insert a second reaction type for the same user (e.g. `'love'`) → allowed (schema permits multiple simultaneous reaction rows per user/post since the type is part of the unique key); `reactions` becomes `{"like":1,"love":1}`.
- [ ] Attempt to insert the same `(post_id, user_id, reaction_type)` again → violates `unique (post_id, user_id, reaction_type)`.
- [ ] `delete from post_reactions where post_id='<post>' and user_id='<user>' and reaction_type='like';` → `reactions` drops the `like` key/count accordingly (never goes negative — verified by `jsonb_object_agg` recompute, not a decrement).
- [ ] As an anonymous/other Supabase role, confirm `select` on `post_reactions` succeeds (`"Anyone can view post reactions"` policy) but `insert`/`delete` for another user's `user_id` is rejected (`auth.uid() = user_id` policies).
- [ ] Delete the parent post → `post_reactions` rows for it cascade-delete (`on delete cascade`).

### 1.2 Video reactions (`video_reactions`, trigger `update_video_reactions_count`)
- [ ] Repeat all of 1.1 against `video_reactions`/`videos.reactions`.

### 1.3 Threaded comment replies (`post_comment_replies`, trigger `update_post_comment_reply_count`)
- [ ] Insert a reply on an existing `post_comments` row → `post_comments.reply_count` increments by 1.
- [ ] Insert two more replies → `reply_count` = 3.
- [ ] Delete one reply → `reply_count` decrements to 2, floors at 0 (`greatest(reply_count - 1, 0)`), never goes negative even if run against a stale count.
- [ ] RLS: as the **reply author**, delete succeeds. As the **parent comment's owner** (different user than the reply author), delete also succeeds — this is the "post/comment owner can delete anyone's reply" policy (`Author or comment owner can delete reply`). As a third unrelated user, delete is rejected.
- [ ] Delete the parent `post_comments` row → replies cascade-delete.

### 1.4 Post shares (`post_shares`, trigger `update_post_share_count`)
- [ ] Insert a share row → `posts.share_count` increments by 1.
- [ ] Attempt a second share by the same user on the same post → violates `unique (post_id, user_id)` (a user can only have one active share of a given post — repeat "shares" must go through delete+insert or be treated as toggle, matching `useTogglePostShare`'s `shared: boolean` contract).
- [ ] Delete the share → `share_count` decrements, floors at 0.
- [ ] RLS: only the share's own `user_id` can insert/delete their own share row; anyone can `select`.

### 1.5 Video shares (`video_shares`)
- [ ] Repeat 1.4 against `video_shares`/`videos.share_count`.

### 1.6 Legacy migration idempotency (`023_migrate_likes_to_reactions.sql`)
- [ ] Re-run the migration file a second time against a database that already ran it → no duplicate rows in `post_reactions`/`video_reactions` (`on conflict (...) do nothing`), no error.
- [ ] Spot-check: `select count(*) from post_likes;` vs `select count(*) from post_reactions where reaction_type='like';` — the reaction count should be `>=` the likes count (extra rows only if a user separately reacted with `'like'` after the migration).

---

## 2. API / hook-level verification (browser console, no UI wiring needed)

Because none of `useTogglePostReaction`, `useVideoToggleReaction`,
`useCommentReplies`/`useAddCommentReply`, or `usePostShareStatus`/
`useTogglePostShare` are called from any component yet, the only way to
exercise them pre-UI is directly, either from the browser DevTools console
against a signed-in session (Supabase client picks up the existing auth
cookie) or from a throwaway test page/route. Example, run in the console on
any page of the running dev app:

```js
const { createClient } = await import('/src/lib/supabase/client.ts') // adjust to actual build output path, or call from a temp component instead
```

In practice it's faster to add a temporary `<button onClick={...}>` calling
the hook in question inside `PostCard.tsx` (revert before committing), or
to write a one-off Playwright/vitest test that imports
`apps/web/src/lib/api.ts` functions directly against a Supabase test
project. Either way, verify:

- [ ] `addPostReaction` / `removePostReaction` round-trip and `getPostUserReaction` reflects the current state.
- [ ] Calling `useTogglePostReaction`'s mutation with `add: true` and an `oldReaction` that differs from `reactionType` removes the old reaction row **before** inserting the new one (see `usePostReactions.ts:29-32`) — confirm only one row remains in `post_reactions` for that `(post_id,user_id)` pair afterward, and that the optimistic cache update in `onMutate` (lines 37-70) correctly decrements the old emoji's count and increments the new one in the `['wall']` query cache.
- [ ] `useVideoToggleReaction` has no `onMutate` optimistic update (unlike the post version) — it only calls `invalidateQueries(['feed'])` in `onSettled`. Confirm the UI (once wired) will show a brief flash/delay rather than instant feedback until this is fixed to match the post hook's pattern.
- [ ] `useAddCommentReply`'s optimistic reply (`optimistic-${Date.now()}` id) is correctly reconciled with the server row on success (`onSuccess` swaps it in `['comment-replies', commentId]`), and rolled back via `context.previous` on error.
- [ ] `useTogglePostShare` optimistically bumps `share_count` on the `['wall']` cache and flips `['post-share-status', postId, userId]`; confirm rollback on a forced error (e.g. temporarily break RLS or disconnect network).
- [ ] `hasUserSharedPost` returns `false` for a logged-out user (`enabled: enabled && !!userId` guard in `usePostShareStatus`) without making a request.

---

## 3. What's actually testable in the UI today

This is the **only** end-user-visible surface right now — the legacy
single-like + flat-comment flow. **Fix the `like_count` regression first**
(§6) or these will show broken counts.

### 3.1 Wall post like (single reaction only, not the new emoji picker)
- [ ] Open `/` (Wall). Find a post.
- [ ] Click "N beğeni" → heart fills, count increments, button turns accent-colored (`PostCard.tsx:129-149`).
- [ ] Click again → unlikes, count decrements.
- [ ] Refresh → state persists (backed by `post_likes` table via `togglePostLike`).
- [ ] Logged-out user sees the same button as a link to `/giris` instead (line 145-149).

### 3.2 Wall flat comments
- [ ] Click "N yorum" → toggles a comment list open/closed (no threading, no replies UI).
- [ ] Type in the input and click "Gönder" → comment appears immediately (`onSuccess` pushes into `['post-comments', postId]` cache) and "N yorum" count increments.
- [ ] Refresh → comment persists.
- [ ] There is no reply/thread affordance, no delete button on comments, and no post-owner badge in this view — do not expect any of those per the current build.

### 3.3 Post owner delete
- [ ] As the post's author, a "Sil" button is visible in the header; clicking prompts `window.confirm('Bu gönderiyi silmek istediğine emin misin?')` and removes the post from the `['wall']` cache on success.
- [ ] As a non-owner, no "Sil" button is rendered.

### 3.4 Explore/video feed like
- [ ] On `/kesfet`, double-tap a video → like burst animation plays and the video is liked if not already (`FeedVideo.tsx:78-83`).
- [ ] Single-tap the heart icon → toggles like/count the same way as the Wall.
- [ ] Comment icon button on the video feed is a static `count={0}` placeholder with no `onClick` — it does nothing today; do not treat that as a bug specific to this phase, it predates it.

---

## 4. Forward-looking UI acceptance checklist (BLOCKED — do not run yet)

Execute this section only after `PostCard.tsx`/`FeedVideo.tsx` are updated
to use `useTogglePostReaction`/`useVideoToggleReaction` with an emoji
picker, comment replies are wired to `useCommentReplies`/
`useAddCommentReply`, a share menu is built on `usePostShareStatus`/
`useTogglePostShare` (and an equivalent video-share hook is written), and
`useWallRealtime`/`useVideoFeedRealtime` are mounted in `Wall.tsx`/
`VideoFeed.tsx`. Turkish labels below reuse the app's existing conventions
(`REACTION_LABELS` in `packages/shared/src/constants.ts`: Beğen / Seviyorum
/ Çok güzel / Üzücü / Kızgın / Komik; `REACTION_EMOJIS`: 👍 ❤️ 😮 😢 😠 😂).

### 4.1 Emoji reactions
- [ ] Reaction trigger opens a picker showing exactly the 6 configured emoji (👍 ❤️ 😮 😢 😠 😂), each labeled per `REACTION_LABELS` on hover.
- [ ] Selecting an emoji closes the picker and shows e.g. "👍 1"; refresh confirms persistence.
- [ ] Selecting a second emoji while one is already active removes the old one and shows only the new one (matches `useTogglePostReaction`'s `oldReaction` handling) — verify no double-count.
- [ ] Re-selecting the currently active emoji removes it entirely (count returns to 0 / no badge shown).
- [ ] Repeat for all 6 emoji types individually.
- [ ] Small-viewport layout: picker renders as a full-width row rather than a cramped dropdown.
- [ ] Repeat the whole set on `/kesfet` video reactions; note `useVideoToggleReaction` currently has **no optimistic update** (only `onSettled: invalidateQueries`) — flag as a follow-up bug if the picker feels laggy compared to the Wall.

### 4.2 Threaded comment replies
- [ ] A comment with replies shows an "N cevap" toggle; expanding fetches via `useCommentReplies(commentId, true)`.
- [ ] Each reply shows avatar, name, body, relative timestamp, and is visually indented under its parent comment.
- [ ] Submitting a reply shows it immediately (optimistic `optimistic-<timestamp>` id), persists after refresh, and increments "N cevap" (backed by the `reply_count` trigger, §1.3).
- [ ] The reply's own author can delete it; the **post's comment owner** can also delete any reply on their comment (per the `Author or comment owner can delete reply` RLS policy) — verify this against `deleteCommentReply` in `lib/api.ts`, which currently has no hook, so this needs a `useDeleteCommentReply` mutation to be added first.
- [ ] A "Gönderi Sahibi" badge (or equivalent) on the post owner's own reply — this is a UI convention to be added; nothing in the schema currently distinguishes it besides comparing `reply.user_id === post.user_id`.

### 4.3 Shares
- [ ] A share control offers something like: paylaş to wall, copy link, send as message.
- [ ] Sharing to wall calls `useTogglePostShare({shared: true})`; `share_count` updates optimistically and persists after refresh; confirm the RLS unique constraint (§1.4) is respected if a user tries to share the same post twice — treat the control as a toggle, not a re-postable action, to match the schema.
- [ ] Copy-link produces a working URL — note there is currently **no post-detail route** in `apps/web/src/app` (no `/gonderi/[id]` or similar); one must be added for a "copy link" action to have somewhere to point.
- [ ] Video share needs a `useVideoShares`-equivalent hook built first (none exists — `addVideoShare`/`removeVideoShare` are unused today).

### 4.4 Realtime sync (2-browser/2-tab)
- [ ] Confirm `useWallRealtime()` is actually invoked from `Wall.tsx` and `useVideoFeedRealtime()` from `VideoFeed.tsx` before testing — as of this writing neither is called anywhere, so realtime sync cannot yet occur regardless of network state.
- [ ] Once mounted: Tab A reacts to a post → Tab B's post updates within ~1-2s via `invalidateQueries(['wall'])` triggered by the `postgres_changes` subscription on `post_reactions` (any event type) — note this refetches the whole wall page rather than patching just the one post, so expect a brief full-list refresh, not a silent single-card patch.
- [ ] Tab A creates a new post → Tab B sees it appear via the `new-posts` channel (`INSERT` on `posts`).
- [ ] There is currently no realtime channel for `post_shares`, `post_comment_replies`, or `video_shares` at all — share-count and reply-count live-sync would require new channels to be added to `useRealtimeUpdates.ts` before this can be tested.
- [ ] Offline resilience: Supabase Realtime auto-reconnects; there is no explicit toast/error UI in `useRealtimeUpdates.ts` today for subscription failures (no `"Canlı güncellemeler devre dışı"` message exists in the codebase) — if that UX is desired it needs to be built; don't test for a toast that isn't implemented.

---

## 5. Error handling (testable at hook level today; UI-level once §4 lands)

- [ ] `useTogglePostReaction`/`useTogglePostShare` roll back their optimistic `['wall']` cache write on mutation error (`onError` restores `context.previous`) — force an error (e.g. call with an invalid `postId`, or simulate a network drop mid-request) and confirm the pre-mutation state is restored.
- [ ] `useVideoToggleReaction` has **no `onError` handler** — if the mutation fails, there is nothing to roll back today (it also has no optimistic update), but this is worth flagging so a future optimistic-update addition doesn't skip the rollback.
- [ ] `useAddCommentReply` rolls back the optimistic reply on error; confirm the input's typed text isn't lost when this happens (currently the composing UI for replies doesn't exist, so this is a §4 follow-up, not testable now).

---

## 6. Type-check / build / lint

### 6.1 Baseline `tsc` errors captured 2026-09-04 (before any Task 8 fix)

Command: `pnpm --filter @stagein/web type-check` (equivalent to `tsc --noEmit` inside `apps/web`).

```
src/app/profil/[username]/page.tsx(152,32): error TS2551: Property 'like_count' does not exist on type 'Video'. Did you mean 'view_count'?
src/components/FeedVideo.tsx(199,104): error TS2551: Property 'like_count' does not exist on type 'Video'. Did you mean 'view_count'?
src/components/PostCard.tsx(143,19): error TS2339: Property 'like_count' does not exist on type 'Post'.
src/components/PostCard.tsx(147,19): error TS2339: Property 'like_count' does not exist on type 'Post'.
src/hooks/useVideoFeed.ts(99,73): error TS2551: Property 'like_count' does not exist on type 'Video'. Did you mean 'view_count'?
src/hooks/useWall.ts(99,89): error TS2339: Property 'like_count' does not exist on type 'Post'.
src/lib/demoContent.ts(19,5): error TS2561: Object literal may only specify known properties, but 'like_count' does not exist in type 'Video'. Did you mean to write 'view_count'?
src/lib/demoContent.ts(44,5): error TS2561: Object literal may only specify known properties, but 'like_count' does not exist in type 'Video'. Did you mean to write 'view_count'?
src/lib/demoContent.ts(69,5): error TS2561: Object literal may only specify known properties, but 'like_count' does not exist in type 'Video'. Did you mean to write 'view_count'?
src/lib/demoContent.ts(97,5): error TS2353: Object literal may only specify known properties, and 'like_count' does not exist in type 'Post'.
src/lib/demoContent.ts(110,5): error TS2353: Object literal may only specify known properties, and 'like_count' does not exist in type 'Post'.
src/lib/demoContent.ts(122,5): error TS2353: Object literal may only specify known properties, and 'like_count' does not exist in type 'Post'.
```

12 errors, 6 files, all one root cause: `like_count` was dropped from
`posts`/`videos` by migrations `018`/`019` and from the `Post`/`Video`
shared types, but 6 call sites weren't migrated to `reactions`/
`my_reaction`. This is a **pre-existing gap**, not something Task 8
introduces — treat it as the fix required before §3 can be tested cleanly,
and before §4 UI work can build on a green baseline.

- [ ] Run the command above, confirm the error set matches (or is a strict subset of, if partially fixed) the 12 listed.
- [ ] Any error **not** in this list is new and must be investigated before proceeding.
- [ ] Zero `any` introduced by whatever fix is applied.

### 6.2 Build

- [ ] `pnpm --filter @stagein/web build` — will fail today for the same reason as §6.1 (Next's production build type-checks by default). Fix §6.1 first.

### 6.3 Lint

- [ ] `pnpm --filter @stagein/web lint` — run and confirm no new issues beyond whatever the current baseline is.

---

## 7. Suggested execution order

1. Fix the `like_count` → `reactions`/`my_reaction` regression in the 6 files listed in §6.1 (blocks everything else).
2. Run §6 to confirm a clean `type-check`/`build`/`lint`.
3. Run §1 (DB triggers/RLS) — ~20 min, needs Supabase SQL access.
4. Run §2 (hook contracts via console/temp harness) — ~20 min.
5. Run §3 (today's actual UI: single-like + flat comments) — ~15 min.
6. Park §4 and §5's UI-dependent items until the emoji picker / reply thread / share menu / realtime mounting land; re-run this file's Section 4 as the acceptance test for that follow-up work.

Total for what's runnable **today** (steps 1–5): roughly 60–70 minutes.
