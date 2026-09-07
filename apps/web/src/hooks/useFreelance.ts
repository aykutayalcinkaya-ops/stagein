'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  completeOrder,
  createFreelanceGig,
  createFreelanceOrder,
  getFreelanceGig,
  getFreelanceGigReviews,
  getFreelanceOrder,
  requestOrderRevision,
  submitOrderRequirements,
  type CreateFreelanceGigInput,
} from '@/lib/api'

export function useFreelanceGig(id: string) {
  return useQuery({
    queryKey: ['freelance-gig', id],
    queryFn: () => getFreelanceGig(id),
    enabled: !!id,
  })
}

export function useFreelanceGigReviews(gigId: string) {
  return useQuery({
    queryKey: ['freelance-gig-reviews', gigId],
    queryFn: () => getFreelanceGigReviews(gigId),
    enabled: !!gigId,
  })
}

export function useCreateFreelanceGig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateFreelanceGigInput) => createFreelanceGig(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['freelance-gig'] })
    },
  })
}

export function useCreateFreelanceOrder() {
  return useMutation({
    mutationFn: (input: {
      gig_id: string
      package_id: string
      buyer_id: string
      seller_id: string
      price: number
    }) => createFreelanceOrder(input),
  })
}

export function useFreelanceOrder(id: string) {
  return useQuery({
    queryKey: ['freelance-order', id],
    queryFn: () => getFreelanceOrder(id),
    enabled: !!id,
  })
}

export function useSubmitOrderRequirements(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requirements: string) => submitOrderRequirements(orderId, requirements),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['freelance-order', orderId] })
    },
  })
}

export function useRequestOrderRevision(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (note: string | null) => requestOrderRevision(orderId, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['freelance-order', orderId] })
    },
  })
}

export function useCompleteOrder(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => completeOrder(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['freelance-order', orderId] })
    },
  })
}
