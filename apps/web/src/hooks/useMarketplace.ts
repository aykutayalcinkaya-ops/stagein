'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MarketplaceItem, MarketplaceOffer } from '@stagein/shared'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import {
  createMarketplaceItem,
  createMarketplaceOffer,
  getMarketplaceItem,
  getMarketplaceOffers,
  respondToMarketplaceOffer,
  type CreateMarketplaceItemInput,
} from '@/lib/api'

export function useMarketplaceItem(id: string) {
  return useQuery({
    queryKey: ['marketplace-item', id],
    queryFn: () => getMarketplaceItem(id),
    enabled: !!id,
  })
}

export interface MarketplaceListFilters {
  city?: string
  category?: string
}

export function useMarketplaceItems(filters: MarketplaceListFilters = {}) {
  return useQuery({
    queryKey: ['marketplace-items', filters],
    queryFn: async () => {
      if (!isSupabaseConfigured) return [] as MarketplaceItem[]
      const supabase = createClient()
      let query = supabase
        .from('marketplace_items')
        .select('*, seller:seller_id(id, username, full_name, avatar_url, city)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(30)

      if (filters.city) query = query.eq('city', filters.city)
      if (filters.category) query = query.eq('category', filters.category)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as MarketplaceItem[]
    },
  })
}

export function useCreateMarketplaceItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateMarketplaceItemInput) => createMarketplaceItem(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['marketplace-items'] })
    },
  })
}

export function useMarketplaceOffers(itemId: string) {
  return useQuery({
    queryKey: ['marketplace-offers', itemId],
    queryFn: () => getMarketplaceOffers(itemId),
    enabled: !!itemId,
  })
}

export function useCreateMarketplaceOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      item_id: string
      buyer_id: string
      seller_id: string
      offer_amount: number
      message?: string | null
    }) => createMarketplaceOffer(input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['marketplace-offers', variables.item_id] })
    },
  })
}

export function useRespondToMarketplaceOffer(itemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
      counterAmount,
    }: {
      id: string
      status: MarketplaceOffer['status']
      counterAmount?: number | null
    }) => respondToMarketplaceOffer(id, status, counterAmount),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['marketplace-offers', itemId] })
    },
  })
}
