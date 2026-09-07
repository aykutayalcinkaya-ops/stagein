'use client'

import type {
  ExperienceLevel,
  FreelanceGig,
  FreelanceOrder,
  FreelanceOrderStatus,
  FreelancePackage,
  FreelanceReview,
  Listing,
  ListingApplication,
  MarketplaceItem,
  MarketplaceOffer,
  MusicianProfile,
  Post,
  PostComment,
  PostCommentReply,
  PostReport,
  PostReportReason,
  PostShare,
  ProfileLink,
  ReactionType,
  User,
  VideoShare,
} from '@stagein/shared'
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

export async function uploadPostPhoto(userId: string, file: File): Promise<string> {
  const supabase = createClient()
  const path = `${userId}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('post-photos').upload(path, file)
  if (error) throw error
  return supabase.storage.from('post-photos').getPublicUrl(path).data.publicUrl
}

const POST_SELECT = `*, user:users(${USER_SELECT}), video:videos(*)`

export interface VideoMetadataInput {
  title?: string | null
  description?: string | null
  city?: string | null
  instruments?: string[]
  genres?: string[]
}

export async function createVideoFromFile(
  userId: string,
  file: File,
  metadata: VideoMetadataInput = {}
): Promise<{ id: string; path: string }> {
  const supabase = createClient()
  const path = `${userId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('videos').upload(path, file)
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: userId,
      storage_path: path,
      video_source: 'upload',
      title: metadata.title ?? null,
      description: metadata.description ?? null,
      city: metadata.city ?? null,
      instruments: metadata.instruments ?? [],
      genres: metadata.genres ?? [],
    })
    .select('id')
    .single()
  if (error) throw error
  return { id: (data as { id: string }).id, path }
}

export interface CreateYoutubeVideoInput extends VideoMetadataInput {
  userId: string
  youtubeUrl: string
}

export async function createYoutubeVideo(input: CreateYoutubeVideoInput): Promise<{ id: string }> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: input.userId,
      storage_path: null,
      youtube_url: input.youtubeUrl,
      video_source: 'youtube',
      title: input.title ?? null,
      description: input.description ?? null,
      city: input.city ?? null,
      instruments: input.instruments ?? [],
      genres: input.genres ?? [],
    })
    .select('id')
    .single()
  if (error) throw error
  return { id: (data as { id: string }).id }
}

export interface CreatePostInput {
  userId: string
  body: string | null
  photoFiles: File[]
  videoFile: File | null
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const supabase = createClient()
  const photoUrls = await Promise.all(input.photoFiles.map((file) => uploadPostPhoto(input.userId, file)))
  const video = input.videoFile ? await createVideoFromFile(input.userId, input.videoFile) : null

  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({ user_id: input.userId, body: input.body, photo_urls: photoUrls, video_id: video?.id ?? null })
      .select(POST_SELECT)
      .single()
    if (error) throw error
    return { ...(data as Post), liked_by_me: false }
  } catch (postError) {
    if (video) {
      try {
        await supabase.from('videos').delete().eq('id', video.id)
        await supabase.storage.from('videos').remove([video.path])
      } catch {
        // Best-effort cleanup only — surfacing the original insert error takes priority.
      }
    }
    throw postError
  }
}

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

export async function deletePost(postId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
}

export async function updatePost(postId: string, body: string): Promise<Post> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .update({ body })
    .eq('id', postId)
    .select(POST_SELECT)
    .single()
  if (error) throw error
  return data as Post
}

/**
 * Bir gönderiyi şikayet eder. Gerçek backend: `029_post_updates_and_reports.sql`
 * migration'ıyla eklenen `post_reports` tablosu + RLS (reporter yalnızca
 * kendi şikayetini oluşturabilir/görebilir). Moderasyon/inceleme paneli bu
 * görevin kapsamı dışında — satırlar tabloda birikir, henüz okuyan bir admin
 * arayüzü yok.
 */
export async function reportPost(postId: string, reporterId: string, reason: PostReportReason): Promise<PostReport> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_reports')
    .insert({ post_id: postId, reporter_id: reporterId, reason })
    .select('*')
    .single()
  if (error) throw error
  return data as PostReport
}

export async function deletePostComment(commentId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('post_comments').delete().eq('id', commentId)
  if (error) throw error
}

export async function toggleVideoLike(videoId: string, userId: string, like: boolean): Promise<void> {
  const supabase = createClient()
  if (like) {
    const { error } = await supabase.from('video_likes').insert({ video_id: videoId, user_id: userId })
    if (error) throw error
  } else {
    const { error } = await supabase.from('video_likes').delete().eq('video_id', videoId).eq('user_id', userId)
    if (error) throw error
  }
}

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

export async function replaceProfileLinks(userId: string, links: { label: string; url: string }[]): Promise<void> {
  const supabase = createClient()
  const { error: deleteError } = await supabase.from('profile_links').delete().eq('user_id', userId)
  if (deleteError) throw deleteError
  if (links.length === 0) return
  const rows = links.map((link, index) => ({ user_id: userId, label: link.label, url: link.url, position: index }))
  const { error: insertError } = await supabase.from('profile_links').insert(rows)
  if (insertError) throw insertError
}

// ---------------------------------------------------------------------------
// Post reactions
// ---------------------------------------------------------------------------

export async function addPostReaction(postId: string, userId: string, reactionType: ReactionType): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('post_reactions')
    .insert({ post_id: postId, user_id: userId, reaction_type: reactionType })
  if (error) throw error
}

export async function removePostReaction(postId: string, userId: string, reactionType: ReactionType): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('post_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('reaction_type', reactionType)
  if (error) throw error
}

export async function getPostUserReaction(postId: string, userId: string): Promise<ReactionType | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_reactions')
    .select('reaction_type')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data?.reaction_type as ReactionType) ?? null
}

// ---------------------------------------------------------------------------
// Video reactions
// ---------------------------------------------------------------------------

export async function addVideoReaction(videoId: string, userId: string, reactionType: ReactionType): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('video_reactions')
    .insert({ video_id: videoId, user_id: userId, reaction_type: reactionType })
  if (error) throw error
}

export async function removeVideoReaction(videoId: string, userId: string, reactionType: ReactionType): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('video_reactions')
    .delete()
    .eq('video_id', videoId)
    .eq('user_id', userId)
    .eq('reaction_type', reactionType)
  if (error) throw error
}

export async function getVideoUserReaction(videoId: string, userId: string): Promise<ReactionType | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('video_reactions')
    .select('reaction_type')
    .eq('video_id', videoId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data?.reaction_type as ReactionType) ?? null
}

// ---------------------------------------------------------------------------
// Comment replies
// ---------------------------------------------------------------------------

export async function addCommentReply(commentId: string, userId: string, body: string): Promise<PostCommentReply> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_comment_replies')
    .insert({ comment_id: commentId, user_id: userId, body })
    .select(`*, user:users(${USER_SELECT})`)
    .single()
  if (error) throw error
  return data as PostCommentReply
}

export async function getCommentReplies(commentId: string): Promise<PostCommentReply[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_comment_replies')
    .select(`*, user:users(${USER_SELECT})`)
    .eq('comment_id', commentId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as PostCommentReply[]
}

export async function deleteCommentReply(replyId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('post_comment_replies').delete().eq('id', replyId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Post shares
// ---------------------------------------------------------------------------

export async function addPostShare(postId: string, userId: string, caption: string | null = null): Promise<PostShare> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_shares')
    .insert({ post_id: postId, user_id: userId, shared_to_wall: true, caption })
    .select(`*, user:users(${USER_SELECT})`)
    .single()
  if (error) throw error
  return data as PostShare
}

export async function removePostShare(postId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('post_shares').delete().eq('post_id', postId).eq('user_id', userId)
  if (error) throw error
}

export async function hasUserSharedPost(postId: string, userId: string): Promise<boolean> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_shares')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return !!data
}

// ---------------------------------------------------------------------------
// Video shares
// ---------------------------------------------------------------------------

export async function addVideoShare(videoId: string, userId: string, caption: string | null = null): Promise<VideoShare> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('video_shares')
    .insert({ video_id: videoId, user_id: userId, shared_to_wall: true, caption })
    .select(`*, user:users(${USER_SELECT})`)
    .single()
  if (error) throw error
  return data as VideoShare
}

export async function removeVideoShare(videoId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('video_shares').delete().eq('video_id', videoId).eq('user_id', userId)
  if (error) throw error
}

export async function hasUserSharedVideo(videoId: string, userId: string): Promise<boolean> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('video_shares')
    .select('id')
    .eq('video_id', videoId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return !!data
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export async function createListing(input: {
  user_id: string
  title: string
  type: Listing['type']
  description: string
  city: string
  instruments: string[]
  genres: string[]
  is_paid: boolean
  budget_min?: number | null
  budget_max?: number | null
  event_date?: string | null
  venue_name?: string | null
}): Promise<Listing> {
  const supabase = createClient()
  const { data, error } = await supabase.from('listings').insert(input).select().single()
  if (error) throw error
  return data as Listing
}

export async function updateListing(id: string, input: Partial<Listing>): Promise<Listing> {
  const supabase = createClient()
  const { data, error } = await supabase.from('listings').update(input).eq('id', id).select().single()
  if (error) throw error
  return data as Listing
}

export async function deleteListing(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('listings').delete().eq('id', id)
  if (error) throw error
}

export async function applyToListing(input: {
  listing_id: string
  applicant_id: string
  message: string
  sample_video_id?: string | null
}): Promise<ListingApplication> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('listing_applications')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as ListingApplication
}

export async function getListingApplications(listingId: string): Promise<ListingApplication[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('listing_applications')
    .select(`*, applicant:applicant_id(${USER_SELECT})`)
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as ListingApplication[]) ?? []
}

export async function updateApplicationStatus(
  id: string,
  status: ListingApplication['status']
): Promise<ListingApplication> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('listing_applications')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as ListingApplication
}

// ---------------------------------------------------------------------------
// Marketplace Offers
// ---------------------------------------------------------------------------

export async function createMarketplaceOffer(input: {
  item_id: string
  buyer_id: string
  seller_id: string
  offer_amount: number
  message?: string | null
}): Promise<MarketplaceOffer> {
  const supabase = createClient()
  const { data, error } = await supabase.from('marketplace_offers').insert(input).select().single()
  if (error) throw error
  return data as MarketplaceOffer
}

export async function getMarketplaceOffers(itemId: string): Promise<MarketplaceOffer[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('marketplace_offers')
    .select(`*, buyer:buyer_id(${USER_SELECT}), seller:seller_id(${USER_SELECT})`)
    .eq('item_id', itemId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as MarketplaceOffer[]) ?? []
}

export async function respondToMarketplaceOffer(
  id: string,
  status: MarketplaceOffer['status'],
  counterAmount?: number | null
): Promise<MarketplaceOffer> {
  const supabase = createClient()
  const update: Partial<Pick<MarketplaceOffer, 'status' | 'counter_amount'>> = { status }
  if (counterAmount !== undefined) update.counter_amount = counterAmount

  const { data, error } = await supabase
    .from('marketplace_offers')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as MarketplaceOffer
}

// ---------------------------------------------------------------------------
// Marketplace Items
// ---------------------------------------------------------------------------

export interface CreateMarketplaceItemInput {
  seller_id: string
  title: string
  description: string
  photos: string[]
  price: number
  city: string
  brand?: string | null
  model?: string | null
  condition: NonNullable<MarketplaceItem['condition']>
  category: string
  is_open_to_trade: boolean
}

export async function uploadMarketplacePhoto(userId: string, file: File): Promise<string> {
  const supabase = createClient()
  const path = `${userId}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('marketplace-photos').upload(path, file)
  if (error) throw error
  return supabase.storage.from('marketplace-photos').getPublicUrl(path).data.publicUrl
}

export async function createMarketplaceItem(input: CreateMarketplaceItemInput): Promise<MarketplaceItem> {
  const supabase = createClient()
  const { data, error } = await supabase.from('marketplace_items').insert(input).select().single()
  if (error) throw error
  return data as MarketplaceItem
}

export async function getMarketplaceItem(id: string): Promise<MarketplaceItem | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('marketplace_items')
    .select(`*, seller:seller_id(${USER_SELECT})`)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as MarketplaceItem) ?? null
}

// ---------------------------------------------------------------------------
// Freelance gigs, packages & orders
// ---------------------------------------------------------------------------

const GIG_SELECT = `*, seller:seller_id(${USER_SELECT}), packages:freelance_packages(*)`

export async function getFreelanceGig(id: string): Promise<FreelanceGig | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('freelance_gigs').select(GIG_SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  return (data as FreelanceGig) ?? null
}

export async function getFreelanceGigReviews(gigId: string): Promise<FreelanceReview[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('freelance_reviews')
    .select(`*, buyer:buyer_id(${USER_SELECT})`)
    .eq('gig_id', gigId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as FreelanceReview[]
}

export interface CreateFreelanceGigInput {
  seller_id: string
  category_id: string
  title: string
  description: string
  requirements: string | null
  packages: {
    tier: FreelancePackage['tier']
    title: string
    price: number
    delivery_days: number
    revisions_count: number
  }[]
}

export async function createFreelanceGig(input: CreateFreelanceGigInput): Promise<FreelanceGig> {
  const supabase = createClient()
  const { data: gig, error: gigError } = await supabase
    .from('freelance_gigs')
    .insert({
      seller_id: input.seller_id,
      category_id: input.category_id,
      title: input.title,
      description: input.description,
      requirements: input.requirements,
    })
    .select()
    .single()
  if (gigError) throw gigError

  const gigId = (gig as { id: string }).id
  const packageRows = input.packages.map((pkg) => ({
    gig_id: gigId,
    tier: pkg.tier,
    title: pkg.title,
    description: pkg.title,
    price: pkg.price,
    delivery_days: pkg.delivery_days,
    revisions_count: pkg.revisions_count,
  }))

  const { error: packagesError } = await supabase.from('freelance_packages').insert(packageRows)
  if (packagesError) {
    await supabase.from('freelance_gigs').delete().eq('id', gigId)
    throw packagesError
  }

  return { ...(gig as FreelanceGig) }
}

export async function createFreelanceOrder(input: {
  gig_id: string
  package_id: string
  buyer_id: string
  seller_id: string
  price: number
}): Promise<FreelanceOrder> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('freelance_orders')
    .insert({ ...input, status: 'requirements_pending' as FreelanceOrderStatus })
    .select()
    .single()
  if (error) throw error
  return data as FreelanceOrder
}

export async function getFreelanceOrder(id: string): Promise<FreelanceOrder | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('freelance_orders')
    .select(
      `*, gig:gig_id(*), package:package_id(*), buyer:buyer_id(${USER_SELECT}), seller:seller_id(${USER_SELECT})`
    )
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as FreelanceOrder) ?? null
}

export async function submitOrderRequirements(orderId: string, requirements: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('freelance_orders')
    .update({ requirements_submitted: requirements, status: 'in_progress' as FreelanceOrderStatus })
    .eq('id', orderId)
  if (error) throw error
}

export async function requestOrderRevision(orderId: string, note: string | null): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('freelance_orders')
    .update({ delivery_note: note, status: 'revision_requested' as FreelanceOrderStatus })
    .eq('id', orderId)
  if (error) throw error
}

export async function completeOrder(orderId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('freelance_orders')
    .update({ status: 'completed' as FreelanceOrderStatus })
    .eq('id', orderId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Account deletion
// ---------------------------------------------------------------------------

/**
 * Kullanıcının kendi hesabını kalıcı olarak silmesini tetikler.
 *
 * NOT (2026-09-06): Sunucu tarafında bu işi yapan bir Postgres fonksiyonu /
 * RLS-safe RPC (`delete_user_account` ya da benzeri) HENÜZ YOK — repo genelinde
 * arandı, tek mevcut RPC `increment_view_count`. Bu fonksiyon best-effort bir
 * çağrı yapar: RPC sunucuda tanımlı değilse Supabase bir hata döner, bu hata
 * olduğu gibi çağırana fırlatılır (sahte bir "başarılı" durumu asla üretilmez).
 * RPC gerçekten var olup başarılı dönerse oturum kapatılır.
 *
 * Gerçek kullanıcı verisi silme akışının canlıya çıkması için bu RPC'nin bir
 * migration ile (kullanıcının kendi satırlarını — posts/videos/messages/
 * listings/vb. — RLS'e uygun şekilde silecek biçimde) eklenmesi gerekiyor.
 */
export async function deleteOwnAccount(): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('delete_user_account')
  if (error) throw error
  await supabase.auth.signOut()
}
