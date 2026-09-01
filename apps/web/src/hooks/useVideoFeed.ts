'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import type { Video } from '@stagein/shared'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'

const PAGE_SIZE = 10

export function useVideoFeed(city?: string) {
  return useInfiniteQuery({
    queryKey: ['feed', city ?? 'all'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!isSupabaseConfigured) return [] as Video[]
      const supabase = createClient()

      let query = supabase
        .from('videos')
        .select('*, user:users(id, username, full_name, avatar_url, city)')
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1)

      if (city) query = query.eq('city', city)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Video[]
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.reduce((sum, p) => sum + p.length, 0),
  })
}
