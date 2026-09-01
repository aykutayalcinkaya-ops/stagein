import { supabase } from '../client'
import type { Listing, ListingType } from '@stagein/shared'

export async function fetchListings(filters?: { city?: string; type?: ListingType; instrument?: string }, offset = 0, limit = 20): Promise<Listing[]> {
  let query = supabase
    .from('listings')
    .select('*, user:users(id, username, full_name, avatar_url, city)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (filters?.city) query = query.eq('city', filters.city)
  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.instrument) query = query.contains('instruments', [filters.instrument])
  const { data, error } = await query
  if (error) throw error
  return data as Listing[]
}

export async function createListing(listing: Omit<Listing, 'id' | 'created_at' | 'expires_at' | 'status'>) {
  const { data, error } = await supabase.from('listings').insert(listing).select().single()
  if (error) throw error
  return data
}
