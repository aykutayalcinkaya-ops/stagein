'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Listing, ListingType } from '@stagein/shared'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createListing } from '@/lib/api'

export interface ListingQueryFilters {
  city?: string
  type?: ListingType
  instrument?: string
  genre?: string
}

export function useListings(filters: ListingQueryFilters = {}) {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: async () => {
      if (!isSupabaseConfigured) return [] as Listing[]
      const supabase = createClient()

      let query = supabase
        .from('listings')
        .select('*, user:users(id, username, full_name, avatar_url, city)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(30)

      if (filters.city) query = query.eq('city', filters.city)
      if (filters.type) query = query.eq('type', filters.type)
      if (filters.instrument) query = query.contains('instruments', [filters.instrument])
      if (filters.genre) query = query.contains('genres', [filters.genre])

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Listing[]
    },
  })
}

export function useCreateListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['listings'] })
    },
  })
}
