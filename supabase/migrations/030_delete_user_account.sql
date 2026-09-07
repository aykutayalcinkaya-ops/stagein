-- Migration: 030_delete_user_account.sql
-- Created: 2026-09-07
--
-- gravity.md "Hesabımı Sil" (self-service account deletion) feature.
-- apps/web/src/app/ayarlar/page.tsx already has the full UI (type "SİL" to
-- confirm) and apps/web/src/lib/api.ts's deleteOwnAccount() already calls
-- supabase.rpc('delete_user_account') with NO arguments — that RPC did not
-- exist anywhere in the database until this migration. This migration adds
-- it. deleteOwnAccount()'s existing error handling is left untouched: it
-- throws whatever error this function raises, and only calls
-- supabase.auth.signOut() if the RPC returns successfully, so any failure
-- here (e.g. an unexpected FK violation) surfaces as a real error to the
-- user instead of a false "deleted" success.
--
-- This migration was written by reading every one of 001..029 end to end to
-- find every table with a foreign key back to users(id) (directly or
-- transitively) or referencing a user under a differently-named column
-- (studio_id, seller_id, buyer_id, sender_id, applicant_id, reviewer_id,
-- from_user_id/to_user_id, etc). It has NOT been pushed to the live database
-- (no DB credentials in this environment) — it exists only in the repo for
-- human review before anyone runs `supabase db push`.
--
-- =============================================================================
-- BLAST RADIUS — every table this function touches, and why
-- =============================================================================
--
-- HARD-DELETED (solely the leaving user's own content; no other real user's
-- transaction/record depends on the row surviving — losing it is the same
-- kind of "your content disappears with you" behavior every social app has):
--   - post_comment_replies   (their own replies to any comment)
--   - post_comments          (their own comments on any post; cascades away
--                             replies OTHERS made under those comments —
--                             same as a deleted post's comments disappearing)
--   - post_reactions, video_reactions        (their own emoji reactions)
--   - post_likes, video_likes                (legacy like tables kept "for
--                             audit" per 023_migrate_likes_to_reactions.sql;
--                             account deletion intentionally overrides that
--                             audit-retention plan for THIS user's own rows —
--                             other users' audit rows are untouched)
--   - post_shares, video_shares              (their own reposts)
--   - post_reports           (reports they filed; reports filed by others
--                             against their posts cascade away when the post
--                             itself is deleted below)
--   - posts                  (their own posts; cascades away likes/reactions/
--                             comments/replies/shares/reports ON those posts,
--                             including ones made by other users — accepted,
--                             same as deleting a post anywhere else)
--   - videos                 (their own videos; same cascade reasoning as
--                             posts; posts.video_id / listing_applications.
--                             sample_video_id already ON DELETE SET NULL so
--                             other users' posts/applications aren't deleted)
--   - listings                (their own band/session/lesson/venue listings;
--                             cascades listing_applications made by OTHER
--                             users to that listing — accepted: an
--                             application has no independent meaning once
--                             its listing is gone, same as a comment)
--   - listing_applications    (their own applications to OTHER users' listings)
--   - profile_links           (their own profile link rows)
--   - musician_profiles       (their own 1:1 profile row — NOTE: this FK has
--                             NO "on delete cascade" in 002_musician_profiles.sql,
--                             so it MUST be deleted explicitly before
--                             public.users or the final DELETE would fail
--                             with a foreign-key violation)
--   - badge_applications (own rows only: WHERE user_id = the leaving user —
--                             this delete is issued alongside the
--                             reviewed_by anonymization below since both
--                             touch the same table and are easiest to reason
--                             about together)
--
-- ANONYMIZED, NOT DELETED (the row is jointly "owned" by another real user —
-- a counterparty in a conversation, an order, a booking, or the subject of a
-- review/endorsement — so we null out the leaving user's identity columns
-- and keep the row intact for the other party's history):
--   - conversations           participant_ids array: the leaving user's id is
--                             removed via array_remove(); no FK exists here
--                             (participant_ids is a plain uuid[], not an FK),
--                             so this is pure privacy hygiene, not a
--                             constraint requirement. The conversation and
--                             its messages remain visible to the other
--                             participant(s).
--   - messages                 sender_id -> NULL. Deleting the leaving user's
--                             messages outright would rip their half of the
--                             conversation out from under the other
--                             participant. content/audio_url are left as-is
--                             (any audio-notes storage object referenced by
--                             audio_url will already have been removed in
--                             the storage cleanup step below, same tradeoff
--                             every "ghost author" pattern makes).
--   - bookings                 studio_id -> NULL where it matches, and
--                             separately user_id -> NULL where it matches
--                             (007_bookings.sql gives neither column
--                             "on delete cascade", so leaving them pointed at
--                             a row we're about to delete would raise an FK
--                             violation — nulling also happens to be exactly
--                             the right anonymization behavior for a
--                             studio/renter booking record the other party
--                             still needs, e.g. for their own payment history).
--   - endorsements              from_user_id/to_user_id both reference users(id)
--                             with no cascade. An endorsement is a note
--                             written BY one user ABOUT another:
--                               * rows where to_user_id = leaving user are
--                                 DELETED — the endorsement was displayed on
--                                 a profile that no longer exists, so it has
--                                 nothing left to attach to.
--                               * rows where from_user_id = leaving user are
--                                 ANONYMIZED (from_user_id -> NULL) instead of
--                                 deleted, so the remaining recipient doesn't
--                                 lose an endorsement on their own profile
--                                 just because the author left. (unique
--                                 (from_user_id, to_user_id) is safe with
--                                 multiple NULLs — Postgres treats NULLs as
--                                 distinct for uniqueness purposes.)
--   - badge_applications        reviewed_by -> NULL where it matches (the
--                             leaving user reviewed someone ELSE's badge
--                             application as an admin/moderator) — the
--                             applicant's own row must survive; only the
--                             reviewer's identity is scrubbed. This runs
--                             after the "own rows" hard-delete above, and
--                             the two predicates are disjoint in effect since
--                             the earlier delete already removed any row
--                             where user_id = the leaving user.
--   - marketplace_items         seller_id -> NULL, status -> 'sold'.
--                             marketplace_items.seller_id has
--                             "on delete cascade" in 008_marketplace.sql, but
--                             marketplace_offers.item_id ALSO cascades from
--                             marketplace_items (027) — so relying on the
--                             default cascade chain here would silently wipe
--                             out a DIFFERENT buyer's entire offer/negotiation
--                             history the moment the seller deletes their
--                             account. Nulling seller_id first breaks that
--                             cascade chain (the row's FK no longer points at
--                             the user being deleted) so the listing row, and
--                             any offers on it, survive; status is flipped to
--                             'sold' so it drops out of the "active" listing
--                             feed.
--   - marketplace_offers        buyer_id -> NULL and, separately, seller_id ->
--                             NULL, wherever each matches the leaving user.
--                             Both columns are "on delete cascade" in
--                             027_marketplace_offers_and_details.sql, which
--                             by default means either party deleting their
--                             account would delete the WHOLE offer row —
--                             destroying the other party's negotiation
--                             history (offer_amount, message, status,
--                             counter_amount). Nulling only the matching
--                             column preserves the row (and the other
--                             party's side of it) intact.
--   - freelance_gigs             seller_id -> NULL, status -> 'paused'. Same
--                             reasoning as marketplace_items: freelance_gigs.
--                             seller_id cascades in 026, but
--                             freelance_packages.gig_id and (critically)
--                             freelance_orders.gig_id/package_id have NO
--                             "on delete cascade" at all — letting the
--                             default cascade fire and delete the gig would
--                             either orphan-fail (FK violation from
--                             freelance_orders, since it has no ON DELETE
--                             behavior) or, if packages cascade first,
--                             destroy a buyer's completed order's context.
--                             Nulling seller_id keeps the gig (and every
--                             package/order that references it) intact and
--                             just removes it from sale.
--   - freelance_orders           buyer_id -> NULL and seller_id -> NULL,
--                             independently, wherever each matches. Neither
--                             column has "on delete cascade" in 026, so this
--                             is both required (to avoid an FK violation on
--                             the final DELETE) and correct (an order is a
--                             joint buyer/seller record neither party should
--                             lose just because the other left).
--   - freelance_reviews          buyer_id -> NULL and seller_id -> NULL,
--                             independently, wherever each matches. Same
--                             reasoning as freelance_orders — rating/comment/
--                             seller_reply are preserved so the gig's
--                             rating_avg/rating_count history stays honest.
--
-- STORAGE:
--   - storage.objects: DELETE FROM storage.objects WHERE
--     (storage.foldername(name))[1] = the leaving user's id. Every bucket's
--     upload path convention is verified in apps/web/src/lib/api.ts
--     (uploadPostPhoto, createVideoFromFile, uploadAvatar,
--     uploadMarketplacePhoto all upload to `${userId}/${timestamp}-${name}`)
--     and matches the RLS policies in 012_storage.sql / 015_storage_post_photos.sql,
--     which all gate delete/insert on
--     `auth.uid()::text = (storage.foldername(name))[1]` for every bucket
--     (videos, avatars, listing-photos, marketplace-photos, audio-notes,
--     badge-documents, post-photos) — so this one predicate is safe across
--     every bucket, including ones apps/web doesn't currently use, without
--     needing a bucket_id allowlist. NOTE: removing the storage.objects
--     metadata row is what this migration can do from plain SQL; whether
--     that alone reclaims the underlying object storage blob depends on the
--     Supabase Storage deployment (hosted Supabase typically reconciles this
--     automatically, self-hosted setups may need a follow-up GC pass) — flag
--     this as a possible follow-up rather than something this migration can
--     verify from inside plpgsql.
--
-- NOT TOUCHED:
--   - freelance_categories: static lookup table, no per-user reference.
--   - freelance_packages: no direct FK to users at all (only gig_id), and
--     freelance_gigs is anonymized rather than deleted above, so nothing
--     here needs to change.
--
-- FINALLY:
--   - DELETE FROM public.users WHERE id = <leaving user>. By this point
--     every non-cascading FK to users(id) (musician_profiles, bookings,
--     endorsements, badge_applications, messages, freelance_orders,
--     freelance_reviews) has already been cleared or deleted, and every
--     cascading FK we want to neutralize (marketplace_items,
--     marketplace_offers, freelance_gigs) has already had its user column
--     nulled — so this DELETE cannot raise an FK violation, and it also
--     triggers the ON DELETE CASCADE cleanup for any leaf/engagement table
--     already explicitly deleted above (harmless no-ops at that point) plus
--     anything else keyed on users(id) with cascade that this review may
--     have missed, as a safety net.
--   - DELETE FROM auth.users WHERE id = <leaving user>, LAST, because
--     001_users.sql defines `users.id uuid references auth.users` with NO
--     "on delete cascade" — public.users must already be gone before this
--     runs, which the ordering above guarantees. CAVEAT: this requires the
--     executing role (the function is SECURITY DEFINER, so it runs as
--     whatever role owns this function — typically `postgres`/the project
--     owner after `supabase db push`) to have privilege to delete from
--     auth.users. This is the standard, supported self-service-deletion
--     pattern on Supabase, but if this project's auth schema ownership has
--     been locked down further than the default, this final statement is
--     where a permissions error would surface — check that before relying on
--     this in production. Supabase's own auth schema (auth.identities,
--     auth.sessions, auth.refresh_tokens, etc. — none of which are defined
--     in this repo's migrations) is expected to cascade from auth.users on
--     its own via Supabase-managed constraints; this migration does not
--     attempt to manage those tables directly.

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- ---------------------------------------------------------------------
  -- 1) Storage: remove the leaving user's uploaded files (path convention
  --    `${user_id}/...` in every bucket, see header comment above).
  -- ---------------------------------------------------------------------
  delete from storage.objects
  where (storage.foldername(name))[1] = v_user_id::text;

  -- ---------------------------------------------------------------------
  -- 2) Own engagement / leaf rows — hard delete (their own actions, no
  --    counterparty depends on these surviving).
  -- ---------------------------------------------------------------------
  delete from public.post_comment_replies where user_id = v_user_id;
  delete from public.post_comments where user_id = v_user_id;
  delete from public.post_reactions where user_id = v_user_id;
  delete from public.video_reactions where user_id = v_user_id;
  delete from public.post_likes where user_id = v_user_id;
  delete from public.video_likes where user_id = v_user_id;
  delete from public.post_shares where user_id = v_user_id;
  delete from public.video_shares where user_id = v_user_id;
  delete from public.post_reports where reporter_id = v_user_id;

  -- ---------------------------------------------------------------------
  -- 3) Own primary content — hard delete (solely theirs; cascades handle
  --    likes/reactions/comments/replies/shares/reports/applications made by
  --    other users on this specific content, same as elsewhere on the
  --    platform when a post/video/listing disappears).
  -- ---------------------------------------------------------------------
  delete from public.posts where user_id = v_user_id;
  delete from public.videos where user_id = v_user_id;
  delete from public.listings where user_id = v_user_id;
  delete from public.listing_applications where applicant_id = v_user_id;
  delete from public.profile_links where user_id = v_user_id;

  -- musician_profiles has NO "on delete cascade" (002_musician_profiles.sql)
  -- so this MUST happen before public.users is deleted.
  delete from public.musician_profiles where user_id = v_user_id;

  -- ---------------------------------------------------------------------
  -- 4) Joint records — anonymize the leaving user's identity columns rather
  --    than deleting the row, so the counterparty keeps their own
  --    conversation/transaction/review history. See header comment for the
  --    full reasoning per table.
  -- ---------------------------------------------------------------------

  -- Conversations: no FK on participant_ids, just remove the leaving user's
  -- id from the array; the conversation and its messages stay visible to
  -- whoever else was in it.
  update public.conversations
  set participant_ids = array_remove(participant_ids, v_user_id)
  where v_user_id = any(participant_ids);

  -- Messages: keep the conversation history, drop the author's identity.
  update public.messages set sender_id = null where sender_id = v_user_id;

  -- Bookings: neither studio_id nor user_id cascades (007_bookings.sql), and
  -- either side may be the leaving user.
  update public.bookings set studio_id = null where studio_id = v_user_id;
  update public.bookings set user_id = null where user_id = v_user_id;

  -- Endorsements: a note written BY from_user_id ABOUT to_user_id.
  -- If the leaving user is the SUBJECT, the endorsement has nothing left to
  -- attach to -> delete it.
  delete from public.endorsements where to_user_id = v_user_id;
  -- If the leaving user is the AUTHOR of an endorsement about someone who is
  -- still here, keep the recipient's endorsement and just scrub authorship.
  update public.endorsements set from_user_id = null where from_user_id = v_user_id;

  -- Badge applications: delete the leaving user's own submitted
  -- applications first, then scrub reviewed_by wherever they reviewed
  -- SOMEONE ELSE's application as an admin/moderator — that applicant's row
  -- must survive, only the reviewer's identity is cleared.
  delete from public.badge_applications where user_id = v_user_id;
  update public.badge_applications set reviewed_by = null where reviewed_by = v_user_id;

  -- Marketplace items: seller_id cascades by default (008_marketplace.sql),
  -- which would otherwise wipe out other buyers' marketplace_offers rows
  -- via marketplace_offers.item_id's own cascade (027). Null seller_id first
  -- to break that chain; mark 'sold' so it leaves the active listing feed.
  update public.marketplace_items
  set seller_id = null, status = 'sold'
  where seller_id = v_user_id;

  -- Marketplace offers: buyer_id/seller_id both cascade by default (027),
  -- which would destroy the counterparty's side of the negotiation. Null
  -- only the matching side.
  update public.marketplace_offers set buyer_id = null where buyer_id = v_user_id;
  update public.marketplace_offers set seller_id = null where seller_id = v_user_id;

  -- Freelance gigs: seller_id cascades by default (026), but
  -- freelance_orders.gig_id/package_id have no "on delete cascade" at all,
  -- so letting the gig cascade-delete would either FK-violate against live
  -- orders or destroy a buyer's order context. Null seller_id, delist it.
  update public.freelance_gigs
  set seller_id = null, status = 'paused'
  where seller_id = v_user_id;

  -- Freelance orders / reviews: neither buyer_id nor seller_id cascades
  -- (026), and both are joint buyer/seller records — anonymize whichever
  -- side matches, keep amounts/ratings/comments intact for the other party.
  update public.freelance_orders set buyer_id = null where buyer_id = v_user_id;
  update public.freelance_orders set seller_id = null where seller_id = v_user_id;
  update public.freelance_reviews set buyer_id = null where buyer_id = v_user_id;
  update public.freelance_reviews set seller_id = null where seller_id = v_user_id;

  -- ---------------------------------------------------------------------
  -- 5) The user rows themselves. public.users first (its FK to auth.users
  --    has no cascade — see 001_users.sql — so auth.users must outlive it
  --    until this point), then auth.users last.
  -- ---------------------------------------------------------------------
  delete from public.users where id = v_user_id;

  -- CAVEAT: requires this function's owning role to have privilege on
  -- auth.users (standard for the SECURITY DEFINER self-deletion pattern on
  -- Supabase, but verify auth schema ownership on this project before
  -- relying on it in production — see header comment above).
  delete from auth.users where id = v_user_id;
end;
$$;

grant execute on function public.delete_user_account() to authenticated;
