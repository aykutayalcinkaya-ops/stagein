import 'server-only'
import type {
  Endorsement,
  Listing,
  ListingType,
  MarketplaceItem,
  MusicianProfile,
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
