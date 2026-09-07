import 'server-only'
import type {
  Endorsement,
  FreelanceGig,
  Listing,
  ListingType,
  MarketplaceItem,
  MusicianProfile,
  Post,
  ProfileLink,
  ReactionType,
  User,
  Video,
} from '@stagein/shared'
import { createClient } from './supabase/server'
import { isSupabaseConfigured } from './supabase/env'

const USER_SELECT = 'id, username, full_name, avatar_url, city, role, bio, email, created_at'

export interface ListingFilters {
  city?: string
  type?: ListingType
  instrument?: string
  genre?: string
  q?: string
}

/** Supabase yapılandırılmadıysa veya sorgu hata verirse sayfalar boş state ile render edilir. */
export async function getListings(filters: ListingFilters = {}, limit = 30): Promise<Listing[]> {
  if (!isSupabaseConfigured) return []
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select(`*, user:users(${USER_SELECT})`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters.city) query = query.eq('city', filters.city)
  if (filters.type) query = query.eq('type', filters.type)
  if (filters.instrument) query = query.contains('instruments', [filters.instrument])
  if (filters.genre) query = query.contains('genres', [filters.genre])
  if (filters.q) query = query.ilike('title', `%${filters.q}%`)

  const { data, error } = await query
  if (error) return []
  return (data ?? []) as Listing[]
}

export async function getListing(id: string): Promise<Listing | null> {
  if (!isSupabaseConfigured) return null
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select(`*, user:users(${USER_SELECT})`)
    .eq('id', id)
    .maybeSingle()
  if (error) return null
  return (data as Listing) ?? null
}

export async function getUserByUsername(username: string): Promise<User | null> {
  if (!isSupabaseConfigured) return null
  const supabase = await createClient()
  const { data, error } = await supabase.from('users').select(USER_SELECT).eq('username', username).maybeSingle()
  if (error) return null
  return (data as User) ?? null
}

export async function getMusicianProfile(userId: string): Promise<MusicianProfile | null> {
  if (!isSupabaseConfigured) return null
  const supabase = await createClient()
  const { data, error } = await supabase.from('musician_profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error) return null
  return (data as MusicianProfile) ?? null
}

export async function getUserVideos(userId: string, limit = 12): Promise<Video[]> {
  if (!isSupabaseConfigured) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data ?? []) as Video[]
}

export async function getUserListings(userId: string, limit = 10): Promise<Listing[]> {
  if (!isSupabaseConfigured) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data ?? []) as Listing[]
}

export async function getEndorsements(userId: string, limit = 10): Promise<Endorsement[]> {
  if (!isSupabaseConfigured) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('endorsements')
    .select(`*, from_user:users!endorsements_from_user_id_fkey(${USER_SELECT})`)
    .eq('to_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data ?? []) as Endorsement[]
}

export async function getMarketplaceItems(city?: string, limit = 30): Promise<MarketplaceItem[]> {
  if (!isSupabaseConfigured) return []
  const supabase = await createClient()
  let query = supabase
    .from('marketplace_items')
    .select(`*, seller:users(${USER_SELECT})`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (city) query = query.eq('city', city)
  const { data, error } = await query
  if (error) return []
  return (data ?? []) as MarketplaceItem[]
}

export async function getFreelanceGigs(limit = 12): Promise<FreelanceGig[]> {
  if (!isSupabaseConfigured) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('freelance_gigs')
    .select(`*, seller:seller_id(${USER_SELECT}), packages:freelance_packages(*)`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data ?? []) as FreelanceGig[]
}

export async function getStudio(id: string): Promise<User | null> {
  if (!isSupabaseConfigured) return null
  const supabase = await createClient()
  const { data, error } = await supabase.from('users').select(USER_SELECT).eq('id', id).eq('role', 'studio').maybeSingle()
  if (error) return null
  return (data as User) ?? null
}

export async function getCityStats(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured) return {}
  const supabase = await createClient()
  const { data, error } = await supabase.from('users').select('city')
  if (error || !data) return {}
  return (data as { city: string | null }[]).reduce<Record<string, number>>((acc, row) => {
    if (!row.city) return acc
    acc[row.city] = (acc[row.city] ?? 0) + 1
    return acc
  }, {})
}

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

async function attachLikedByMe(
  posts: Post[],
  viewerId: string | undefined,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Post[]> {
  if (!viewerId || posts.length === 0) return posts
  const postIds = posts.map((p) => p.id)
  const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', viewerId).in('post_id', postIds)
  const likedIds = new Set((likes ?? []).map((row) => row.post_id as string))

  const { data: reactions, error: reactionsError } = await supabase
    .from('post_reactions')
    .select('post_id, reaction_type')
    .eq('user_id', viewerId)
    .in('post_id', postIds)
  const reactionsMap = new Map(
    !reactionsError && reactions
      ? (reactions as Array<{ post_id: string; reaction_type: ReactionType }>).map((r) => [r.post_id, r.reaction_type])
      : []
  )

  return posts.map((p) => ({ ...p, liked_by_me: likedIds.has(p.id), my_reaction: reactionsMap.get(p.id) ?? null }))
}
