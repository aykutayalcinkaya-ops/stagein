import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchListings } from '@stagein/supabase'
import type { ListingType } from '@stagein/shared'

const PAGE_SIZE = 20

export interface ListingFilters {
  city?: string
  type?: ListingType
  instrument?: string
}

export function useListings(filters: ListingFilters) {
  const query = useInfiniteQuery({
    queryKey: ['listings', filters],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchListings(filters, pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
  })

  const pages = query.data?.pages
  const listings = useMemo(() => pages?.flat() ?? [], [pages])

  return { ...query, listings }
}
