# Gravity Full-Site Audit & UI/UX Overhaul — Implementation Plan

> **For agentic workers:** Executed via superpowers:subagent-driven-development
> style parallel dispatch (see Execution Waves below). This is a UI/content
> overhaul across a Next.js app with no existing unit-test harness for React
> components (no jest/vitest/playwright configured) — verification per task
> is `pnpm --filter @stagein/web type-check` + `pnpm --filter @stagein/web build`
> plus a manual acceptance checklist, not red/green unit TDD. Final end-to-end
> verification is TestSprite (see Wave 4).

**Goal:** Execute `gravity.md` in full: fix the 8 reported critical bugs, pass
the 20-item quality checklist across `apps/web`, using `motion` + Radix
primitives + `lucide-react`, then verify with TestSprite and report.

**Spec:** `../../../gravity.md` (repo root `gravity.md`)

**Source of truth for current bugs:** `docs/TESTING.md` §0 — confirms
`PostCard.tsx` and `FeedVideo.tsx` are still wired to the old single-`like`
path (`post_likes`/`video_likes`) even though migrations 018/019 dropped
`like_count` columns, producing `NaN`/`undefined beğeni`. This is the root
cause behind gravity.md items 2 and 3.

## Global Constraints

- Web-only (`apps/web`); never redirect to a mobile app. `apps/mobile` is out
  of scope for this pass.
- Libraries already installed this session: `motion`, `lucide-react`,
  `@radix-ui/react-dropdown-menu`, `@radix-ui/react-dialog`,
  `@radix-ui/react-popover` (all in `apps/web/package.json`).
- `ui-ux-pro-max@ui-ux-pro-max-skill` plugin installed (user-scope) — use its
  skill guidance for visual polish where it loads.
- No "Topluluk" route exists in `apps/web` — per user decision, skip it;
  apply sitewide changes (item 5) to the routes that actually exist: `ilanlar`,
  `pazar`, `kesfet`, `profil`, `ayarlar`.
- Turkish only, `tr-TR` date formatting, no lorem ipsum, no English leftovers.
- Every destructive action needs a confirm modal. Every interactive element
  ≥44×44px (already the default via `ui.tsx`'s `Button`/`LinkButton` after
  Wave 1 — use those instead of raw `<button>` and this is automatic).
- **CORRECTED after Wave 1 (item 7, "karanlık modda beyaz"): this app has NO
  light mode and NO `dark:` Tailwind variant mechanism at all** — verified
  zero `dark:`-prefixed classes exist anywhere in `apps/web/src`, and
  `globals.css` sets `color-scheme: dark` with only dark design tokens
  defined. **Never add `dark:` classes — they will never activate and are
  dead code.** The real item-7 fix is: replace components that hardcode the
  *light* Tailwind palette (`bg-white`, `bg-gray-50`, `text-gray-700`,
  `min-h-screen bg-gray-50`, etc. — these render as jarring white panels
  inside an otherwise all-dark app) with the app's existing dark design
  tokens (`bg-card`, `border-border`, `text-text`, `text-text-secondary`,
  `text-muted`, `bg-surface` — check `globals.css`/`ui.tsx` for the full
  token list before inventing new ones).
- **New shared components from Wave 1 — use these, don't rebuild them:**
  `@/components/EmptyState` (`{ icon?, title, description?, action?: { label, onClick }, className? }`),
  `@/components/ConfirmDialog` (`{ open, onOpenChange, title, description?, confirmLabel?, cancelLabel?, variant?: 'default'|'destructive', onConfirm }`),
  `@/components/DropdownMenu` (composable: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` (`variant?: 'default'|'destructive'`), `DropdownMenuSeparator`, `DropdownMenuLabel`),
  `@/components/Skeleton` (`Skeleton`, `LineSkeleton`, `AvatarSkeleton`, `CardSkeleton`, `useTimeout(ms, resetKey?): boolean`),
  `@/lib/format` (`formatDateTr(date)` → "14 Haz 2024", `formatRelativeTr(date)` → "3 sa önce").
  Note: `ui.tsx` already had its own older `EmptyState`/`Skeleton` (still used
  by ~10 existing call sites, left untouched for backward compat) — for any
  NEW code in Waves 2-3, prefer the new `@/components/EmptyState` /
  `@/components/Skeleton`, not the old `ui.tsx` ones.
  `ui.tsx`'s `Button`/`LinkButton` now support `variant`: `primary`,
  `secondary`, `destructive`, `accent` (plus legacy `outline`/`ghost`, kept
  for existing call sites) and already include `whileTap={{ scale: 0.96 }}`
  and the 44px hit-target — just use `<Button variant="destructive">` etc.,
  don't hand-roll tap animation or sizing.
- **`EmptyState` and `LinkButton` already exist in `apps/web/src/components/ui.tsx`**
  (verified 2026-09-06, e.g. consumed by `apps/web/src/app/ilanlar/page.tsx`).
  Any task needing an empty-state must import the existing one from `@/components/ui`
  — never create a second `EmptyState` component/file. If Wave 1's F1 task
  already created a duplicate `EmptyState.tsx` before this was caught, the
  coordinator reconciles it by deleting the duplicate and keeping/enhancing
  the `ui.tsx` version before Wave 2 starts.
- **`ListingFilters.tsx` (`apps/web/src/components/ListingFilters.tsx`) already
  uses native `<select>` dropdowns for Şehir/Enstrüman/Tarz (single-select,
  not open pill stacks)** — only its "type" row (Tümü/Grup/Session/Ders) is
  pill-buttons, and that's a reasonable 4-option segmented control, not the
  "hap yığını" gravity.md complains about. The real open-pill multi-select
  problem is in the create/edit forms (`ilanlar/yeni`, `pazar/yeni`, profile
  tag pickers) — verify per-file before assuming every file needs a full
  rebuild; where a page already uses a sane control, the fix may just be
  swapping single-select `<select>` for the new multi-select `FilterDropdown`
  (nice-to-have) rather than a structural rewrite.

---

## File Ownership Map (prevents parallel-agent write conflicts)

| Owner | Files |
|---|---|
| Wave 1 — FOUNDATION | `apps/web/src/components/ui.tsx`, new `apps/web/src/components/EmptyState.tsx`, new `apps/web/src/components/ConfirmDialog.tsx`, new `apps/web/src/components/DropdownMenu.tsx` (Radix wrapper), new `apps/web/src/components/Skeleton.tsx`, `apps/web/src/lib/format.ts` (tr-TR relative/absolute date helpers), `apps/web/src/app/globals.css` (dark-mode tokens only) |
| Wave 1 — YOUTUBE | `apps/web/src/lib/youtube.ts`, `packages/shared/src/constants.ts` (`YOUTUBE_URL_REGEX` only) |
| Wave 2 — FEED | `apps/web/src/components/Wall.tsx`, `apps/web/src/components/PostCard.tsx`, `apps/web/src/components/ShareMenu.tsx`, `apps/web/src/components/CommentThread.tsx`, `apps/web/src/hooks/usePostReactions.ts`, `apps/web/src/hooks/usePostShares.ts`, `apps/web/src/hooks/useWall.ts`, `apps/web/src/lib/demoContent.ts`, post-related functions in `apps/web/src/lib/api.ts` |
| Wave 2 — VIDEO | `apps/web/src/components/FeedVideo.tsx`, `apps/web/src/app/kesfet/page.tsx`, `apps/web/src/app/kesfet/yukle/page.tsx`, `apps/web/src/hooks/useVideoFeed.ts`, `apps/web/src/hooks/useVideoSource.ts` |
| Wave 2 — FILTERS | new `apps/web/src/components/FilterDropdown.tsx` (multi-select accordion/dropdown), `apps/web/src/components/ListingFilters.tsx`, `apps/web/src/app/ilanlar/page.tsx`, `apps/web/src/app/ilanlar/yeni/page.tsx`, `apps/web/src/app/pazar/[id]/page.tsx`, `apps/web/src/app/pazar/yeni/page.tsx`, `apps/web/src/components/MarketplaceCard.tsx`, `apps/web/src/app/profil/[username]/page.tsx`, **`apps/web/src/components/marketplace/*.tsx`** (MarketplaceDetailContent, MarketplaceFilters, ImageGallery, OfferModal — added after Wave 1 found these hardcode the light palette; fix that here as item-7 while you're in these files) |
| Wave 2 — SETTINGS | `apps/web/src/app/ayarlar/page.tsx` |
| Wave 3 — QUALITY-SWEEP | `apps/web/src/app/freelance/**`, **`apps/web/src/components/freelance/*.tsx`** (GigDetailContent, OrderWorkspaceContent, PackageSelector, PackageComparisonTable, GigCard, AudioSamplePlayer — light-palette bug, found by Wave 1), **`apps/web/src/components/ListingApplicationModal.tsx`** (same bug), `apps/web/src/app/giris/page.tsx`, `apps/web/src/app/hakkimizda/page.tsx`, `apps/web/src/app/iletisim/page.tsx`, `apps/web/src/app/gizlilik/page.tsx`, `apps/web/src/app/kullanim-kosullari/page.tsx`, `apps/web/src/app/studyo/[id]/page.tsx`, `apps/web/src/app/not-found.tsx`, `apps/web/src/app/layout.tsx` |

No two agents in the same wave touch the same file. Wave *N* only starts
after Wave *N-1* has landed (so later waves can import Wave 1's new
components).

---

## Wave 1 — Foundation + isolated bug fix (parallel)

### Task F1: Design system primitives

**Files:** see table above (FOUNDATION row)

- [ ] In `ui.tsx`, replace uniform-blue button styling with semantic variants:
      `primary` (brand), `secondary` (neutral/outline), `destructive` (red,
      for delete/report), `accent` (highlight CTAs). Every variant gets a
      `dark:` counterpart and a `whileTap={{ scale: 0.96 }}` motion wrapper.
- [ ] Add `EmptyState.tsx`: icon (lucide-react) + heading + short Turkish
      copy + optional CTA button prop. Used by any list that can render 0
      items.
- [ ] Add `ConfirmDialog.tsx`: Radix `AlertDialog`/`Dialog` + `motion`
      fade-in/scale, title/description/confirm-label/cancel-label props,
      `destructive` visual variant for delete flows.
- [ ] Add `DropdownMenu.tsx`: thin wrapper over
      `@radix-ui/react-dropdown-menu` with `motion` fade/scale on open, used
      for the post 3-dot menu and anywhere else a menu is needed.
- [ ] Add `Skeleton.tsx`: pulse-animated placeholder blocks (card skeleton,
      line skeleton, avatar skeleton) plus a `useTimeout(ms)` hook pattern so
      any spinner can fall back to an error/EmptyState after a timeout
      instead of spinning forever (item 4 — "sonsuz spinner").
- [ ] `format.ts`: `formatRelativeTr(date)` → "3 sa önce", "2 gün önce", and
      `formatDateTr(date)` → "14 Haz 2024", both `tr-TR` locale, replacing
      any `toLocaleDateString('en-US')`/hardcoded US-format calls found via
      `grep -rn "toLocaleDateString\|toLocaleString" apps/web/src`.
- [ ] `globals.css`: audit CSS variables/tokens used for backgrounds on
      cards/inputs/menus; ensure a dark-mode value exists for every one
      referenced by `dark:` utility classes elsewhere (fixes item 7 at the
      token level; per-component class fixes happen in later waves).
- [ ] Verify: `pnpm --filter @stagein/web type-check` passes.

### Task F2: YouTube embed bug (gravity.md item 1)

**Files:** `apps/web/src/lib/youtube.ts`, `packages/shared/src/constants.ts`

- [ ] Read current `YOUTUBE_URL_REGEX`, `extractYoutubeVideoId`,
      `isValidYoutubeUrl`, `getYoutubeThumbnail`. Reproduce the "video
      yüklenemedi" failure against real `youtube.com/watch?v=`,
      `youtu.be/`, and `youtube.com/shorts/` URLs (with query params like
      `?si=`, `&t=`, playlist params) to find the actual parsing gap.
  - [ ] Fix the regex/parser so all three URL shapes extract a clean 11-char
      video ID, ignoring extra query params.
  - [ ] Confirm the embed uses `https://www.youtube.com/embed/{id}` (or
      `youtube-nocookie.com`) with correct iframe `allow`/`sandbox`
      attributes so it isn't silently blocked.
- [ ] Verify: type-check passes; manually construct all three URL shapes in
      a small script/test call to `extractYoutubeVideoId` and confirm each
      returns the correct ID.

---

## Wave 2 — Feature fixes (parallel, after Wave 1 lands)

### Task W2-FEED: Anasayfa/Wall + PostCard overhaul (items 2 partial, 3, 4)

**Files:** see table (FEED row)

> **Verified current state (read directly from `PostCard.tsx` on 2026-09-06,
> supersedes the older `docs/TESTING.md` §0 claim that it's still on the old
> `like_count`/`post_likes` path — that part is already fixed):**
> `PostCard.tsx` already uses `useTogglePostReaction` + `ReactionPicker` for
> reactions and `useTogglePostShare` + `post.share_count` for shares. Reaction
> dedup (thumbs-up-over-heart) is NOT PostCard's bug — check `ReactionPicker.tsx`
> for that instead. The confirmed, still-present bugs in `PostCard.tsx` are:
> 1. Line ~111-119: an inline text-only "Sil" button sits directly in the
>    card header — this is gravity.md item 4, replace with the 3-dot dropdown.
> 2. Line ~171-178: the exact "Paylaş 1" bug — `<ShareMenu/>` renders its own
>    button with an icon + the literal text "Paylaş" (see `ShareMenu.tsx`
>    line ~90-103), and PostCard then renders `post.share_count` as a
>    *separate sibling `<span>`* right after it inside a
>    `flex items-center gap-1.5` wrapper. Visually this reads as
>    "🔗 Paylaş  1" — a floating number, inconsistent with how Yorum renders
>    (single button showing "`{count}` yorum" as one string). Fix: give
>    `ShareMenu` a `shareCount?: number` prop and render the count *inside*
>    the button itself (e.g. icon + "Paylaş" only when count is 0, or icon +
>    `{count}` matching the Beğeni/Yorum visual pattern once you've decided
>    the sitewide counter convention) — then delete the sibling `<span>` in
>    `PostCard.tsx`. Whatever convention you pick, apply it consistently to
>    all three counters (reaction total, yorum count, paylaş count) so they
>    share font-size, gap, and icon-then-number order.
- [ ] Check `ReactionPicker.tsx` (not in the original file list — add it to
      your file ownership, it's a FEED-only concern) for gravity.md item 2's
      "mükerrer Beğeni (Thumbs Up) ve Kalp ikonları" complaint — if it
      renders both a thumbs-up default state AND a separate heart icon
      stacked/adjacent rather than one clean reaction trigger that expands
      to the 6-emoji picker on interaction, consolidate to one trigger.
- [ ] Replace the inline "Sil" button in the post header with a
      `DropdownMenu` (3-dot trigger, top-right of the card) containing:
      Düzenle, Sil (opens `ConfirmDialog`, destructive variant), Bağlantıyı
      Kopyala (`navigator.clipboard.writeText`, toast/confirmation on
      success), Şikayet Et (opens a simple reason-select `ConfirmDialog` or
      a follow-up modal — stub the report target if no backend endpoint
      exists yet, but the UI flow must be complete).
- [ ] Redesign the card shell: glass/blur surface, consistent padding,
      `dark:` classes throughout, `whileTap` on all buttons, `motion`
      fade-in on mount, EmptyState in `Wall.tsx` when `initialPosts` is
      empty.
- [ ] Verify: `pnpm --filter @stagein/web type-check` + `build` pass.
      Confirm no remaining reference to `like_count`/`post_likes` in the
      files this task owns (`grep -rn "like_count\|post_likes"` in FEED
      files should be empty).

### Task W2-VIDEO: Keşfet action bar, dedupe reactions, back/close nav (items 2, 6)

**Files:** see table (VIDEO row)

> **Verified current state (read directly from `FeedVideo.tsx` on
> 2026-09-06):** already uses `useVideoToggleReaction` (not the old
> `video_likes` path) — that part is fine. The actual "mükerrer Beğeni ve
> Kalp ikonları alt alta" bug is in `VideoReactionPanel` (inside
> `FeedVideo.tsx`, ~line 52-95): it renders the top-3 reaction emoji as
> individual stacked `IconButton`s (`flex flex-col`) **and then** renders a
> separate `<ReactionPicker postId="" videoId={video.id} .../>` right below
> them — two different reaction controls stacked vertically. Fix: pick ONE
> — either the top-reactions quick-toggle row *or* the picker trigger, not
> both (e.g. show top reactions inline horizontally as a summary, with a
> single picker trigger button, not a second full-size icon button below
> the stack).
> Also: `ShareMenu` (~line 276-282) renders its own plain text+icon button
> style, which visually breaks the consistent circular `backdrop-blur-md`
> `IconButton` chip style used by every other action (Cevaplar, Mesaj at,
> Ses at ~line 284-313). `ShareMenu` needs a `variant="icon"` (or similar)
> prop so in this context it renders as the same circular glass chip as its
> neighbors — do not change its default text-button rendering used by
> `PostCard.tsx` (owned by the FEED task; coordinate by adding an optional
> prop with a safe default, never changing the existing default behavior).
- [ ] Standardize Beğeni/Yorum/Paylaş/Ses/DM buttons: identical
      `backdrop-blur-md rounded-full` chip, identical icon size (lucide-react,
      same stroke width), identical vertical gap between them, right-aligned
      column with equal padding from the viewport edge and matching
      hit-target ≥44×44px.
- [ ] Add a `← Geri` / `✕` glass button, top-left, on: (a) the Keşfet
      full-screen video view (`kesfet/page.tsx`) and (b) the Keşfet Yükle
      page (`kesfet/yukle/page.tsx`). Must call `router.back()` and also
      work correctly with the browser back button (i.e., don't just
      `router.push`/replace in a way that breaks history — test actual
      back-button navigation, not just the on-screen control).
- [ ] Apply `motion` transitions for feed item swap (spring) and the
      back/close button fade-in.
- [ ] Verify: type-check + build pass; grep this task's files for
      `like_count\|video_likes` — must be empty.

### Task W2-FILTERS: Sitewide filter pill → dropdown/multi-select (item 5, partial 20-list #8 hit-target)

**Files:** see table (FILTERS row)

- [ ] Build `FilterDropdown.tsx`: a single reusable component taking
      `{ label, options, selected, onChange, multiple }`; renders a trigger
      button showing selected-count badges, opens a Radix `Popover` panel
      with checkboxes (multi-select) or an accordion for grouped filters
      (Şehir / Enstrüman / Tarz / Seviye), closes on outside click/Escape,
      keyboard-navigable.
- [ ] Replace the open pill/tag stacks in `ilanlar/page.tsx`,
      `ilanlar/yeni/page.tsx`, `pazar/[id]/page.tsx`, `pazar/yeni/page.tsx`,
      `MarketplaceCard.tsx` filter/tag UI, and `profil/[username]/page.tsx`
      with `FilterDropdown`, summarizing current selections as badges on the
      trigger.
- [ ] `motion` accordion expand/collapse animation; `whileTap` on the
      trigger.
- [ ] Verify: type-check + build pass.

### Task W2-SETTINGS: Profil Düzenleme multi-select + hesap silme (items 7, 18)

**Files:** `apps/web/src/app/ayarlar/page.tsx`

- [ ] Convert enstrüman/tarz/şehir fields to a modal (`ConfirmDialog`-style
      Radix `Dialog`, non-destructive variant) with multi-select
      add/remove, backed by `FilterDropdown` if it's already landed by the
      time this task runs, else an inline Radix `Dialog` + checkbox list
      (do not block on FILTERS — implement independently if needed, then a
      later small pass can swap to the shared component).
- [ ] Add a KVKK-compliant "Hesabımı Sil" flow: settings section → button
      opens `ConfirmDialog` (destructive) explaining consequences in plain
      Turkish → typed confirmation (e.g. type "SİL") → calls a deletion
      action. If no backend endpoint exists yet, wire it to whatever
      account-deletion API/edge function exists in `packages/supabase`; if
      none exists, implement the client flow calling `supabase.auth` +a
      Supabase RPC/edge function stub, and note explicitly in the final
      report that the destructive backend operation needs a real endpoint
      before shipping (do not fabricate a fake success state).
- [ ] Verify: type-check + build pass.

---

## Wave 3 — Sitewide 20-item quality sweep (after Wave 2 lands)

### Task W3-QUALITY: remaining pages + repo-wide grep passes

**Files:** see table (QUALITY-SWEEP row) plus repo-wide `grep` audits that
touch no code (read-only checks) for items already fixed by Waves 1–2.

For each of the 20 checklist items, state `[VAR / YOK / EMİN DEĞİLİM]` with
file:line evidence in the final report, and fix in the files this task owns:

1. EmptyState on every list in QUALITY-SWEEP pages that can render 0 items.
2. Reuses Wave 1's semantic button variants — grep QUALITY-SWEEP files for
   any remaining flat `bg-blue-500`-style buttons and swap to `ui.tsx`
   variants.
3. Replace any generic "Bir sorun oluştu" text in these pages with specific,
   actionable Turkish copy.
4. Any spinner in these pages gets the Wave 1 `Skeleton`/timeout pattern.
5. N/A here (filters live in Wave 2 pages) — confirm no stray pill UI was
   missed via `grep -rn "rounded-full" apps/web/src/app` cross-checked
   against the FILTERS task's file list.
6. N/A here (covered in Wave 2 VIDEO).
7. `grep -rln "className=\"[^\"]*\"" apps/web/src/app apps/web/src/components | xargs grep -L "dark:"` to find components with zero `dark:` classes; fix any inside QUALITY-SWEEP files (flag the rest for a follow-up if outside scope).
8. Audit every `<button>`/clickable `<div>` in these pages for computed
   min size; add `min-h-11 min-w-11` (44px @ default rem) where missing.
9. Add `pb-[env(safe-area-inset-bottom)]`-style safe-area padding to fixed
   bottom bars/inputs in these pages (only relevant if any fixed bottom UI
   exists on web — mobile web browsers with notches still apply safe-area).
10. `grep -rniE "lorem ipsum|placeholder text|TODO: copy"` across `apps/web/src` — replace any hits with real Turkish copy (report file:line even if the fix lands in another wave's file — flag it for that task).
11. `grep -rnE "[A-Za-z]{4,}" apps/web/src/app` spot-check QUALITY-SWEEP pages for stray English UI strings (button labels, headings) and translate.
12. Any date rendering in these pages switches to Wave 1's `formatDateTr`/`formatRelativeTr`.
13. Any delete/destructive action in these pages (e.g. freelance sipariş iptali) gets Wave 1's `ConfirmDialog`.
14. `whileTap={{ scale: 0.96 }}` added to primary buttons in these pages via the Wave 1 `ui.tsx` variants (should be automatic once they're reused — verify no page hand-rolls a raw `<button>` bypassing `ui.tsx`).
15. `motion` fade-in on page mount / list items in these pages.
16-17. Only relevant if these pages request camera/mic (`studyo` recording flow, if any) — if `studyo/[id]/page.tsx` requests media permissions, add an explanatory pre-permission modal and ensure the request fires only on the triggering action, not on page load.
18. Covered by W2-SETTINGS — confirm the "Hesabımı Sil" entry point is discoverable from `ayarlar/page.tsx` (cross-file check only, no edit here).
19. Swap any non-lucide icon usage in these pages to `lucide-react`, matching stroke width used in Wave 1/2 components.
20. Full manual pass: visit every route in `apps/web/src/app`, watch browser console for errors while clicking through primary flows.

- [ ] Verify: `pnpm --filter @stagein/web type-check` + `pnpm --filter @stagein/web build` pass with zero errors/warnings introduced by this task.

---

## Wave 4 — Full-repo verification build + TestSprite

### Task V1: Type-check, build, console-error pass

- [ ] `pnpm --filter @stagein/web type-check` — must be clean.
- [ ] `pnpm --filter @stagein/web build` — must succeed.
- [ ] Fix any cross-task integration errors surfaced by the build (e.g. a
      prop rename in `ui.tsx` that a Wave 2/3 file didn't pick up).

### Task V2: TestSprite plan + run

- [ ] Use the `testsprite-verify` (project already has a TestSprite project:
      `.testsprite/config.json`, projectId `bb1f4e53-881c-4dcc-8217-d85ab2ef593f`)
      or `testsprite-onboard` flow (if no tests exist yet under that project)
      to derive test cases covering, at minimum: YouTube URL embed success
      (all 3 URL shapes), Keşfet reaction toggle, Keşfet back/close
      navigation (including real browser back button), Wall post reaction +
      share count display, post 3-dot menu (edit/delete-confirm/copy-link/
      report), filter dropdown multi-select on `ilanlar` and `pazar`,
      profile edit multi-select + hesap silme confirmation flow, dark mode
      render check on Wall/PostCard/FilterDropdown, and a full-site
      click-through smoke test for console errors.
- [ ] Run the tests via the `testsprite` CLI to a terminal verdict (not just
      created — actually executed).
- [ ] Capture pass/fail per test and any failure artifacts.

---

## Wave 5 — Report

### Task R1: Final report

- [ ] List every file created/modified, grouped by wave/task.
- [ ] 20-item before/after status table (`[VAR/YOK/EMİN DEĞİLİM]` → fixed
      status), per gravity.md §Adım 4.
- [ ] Summary of UI/UX improvements made.
- [ ] TestSprite results summary (pass/fail counts, links to any failure
      artifacts).
- [ ] Explicitly flag anything left incomplete or requiring a decision
      (e.g. account-deletion backend endpoint, Topluluk page skipped per
      user decision, any TestSprite failures not auto-fixed).
