import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { UserAvatar } from '@/components/UserAvatar'
import { fetchListing, getOrCreateConversation } from '@/lib/api'
import { EXPERIENCE_LABELS, LISTING_TYPE_LABELS, formatRelativeTime } from '@/lib/format'
import { colors } from '@/lib/theme'
import { useAuthStore } from '@/stores/authStore'

export default function IlanDetayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const session = useAuthStore((s) => s.session)
  const [busy, setBusy] = useState(false)

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListing(id),
    enabled: Boolean(id),
  })

  async function message() {
    if (!listing) return
    if (!session) {
      router.push('/(auth)/giris')
      return
    }
    setBusy(true)
    try {
      const conversation = await getOrCreateConversation(session.user.id, listing.user_id)
      router.push({
        pathname: '/(tabs)/mesajlar/[id]',
        params: { id: conversation.id, contextType: 'listing', contextId: listing.id },
      })
    } finally {
      setBusy(false)
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-dark">
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (!listing) {
    return (
      <View className="flex-1 items-center justify-center bg-dark px-6">
        <Text className="text-xl font-bold text-text">İlan bulunamadı</Text>
        <Pressable className="mt-4 rounded-lg bg-primary px-6 py-3" onPress={() => router.back()}>
          <Text className="font-semibold text-text">Geri dön</Text>
        </Pressable>
      </View>
    )
  }

  const isOwner = session?.user.id === listing.user_id

  return (
    <View className="flex-1 bg-dark">
      <View className="flex-row items-center gap-3 px-4 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <Pressable className="h-10 w-10 justify-center" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-bold text-text">İlan</Text>
      </View>

      <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-row items-center gap-2">
          <View className="rounded-full bg-primary/20 px-3 py-1">
            <Text className="text-xs font-medium text-primary">
              {LISTING_TYPE_LABELS[listing.type]}
            </Text>
          </View>
          {listing.is_paid ? (
            <View className="rounded-full bg-accent/20 px-3 py-1">
              <Text className="text-xs font-medium text-accent">Ücretli</Text>
            </View>
          ) : null}
          <Text className="ml-auto text-xs text-muted">{formatRelativeTime(listing.created_at)}</Text>
        </View>

        <Text className="mt-4 text-3xl font-black text-text">{listing.title}</Text>

        <View className="mt-4 flex-row flex-wrap gap-2">
          {listing.city ? <Meta icon="location-outline" label={listing.city} /> : null}
          {listing.experience_level ? (
            <Meta icon="stats-chart-outline" label={EXPERIENCE_LABELS[listing.experience_level]} />
          ) : null}
        </View>

        {listing.description ? (
          <Text className="mt-6 text-base leading-6 text-text-secondary">{listing.description}</Text>
        ) : null}

        {listing.instruments.length > 0 ? (
          <Detail title="Enstrüman" values={listing.instruments} />
        ) : null}
        {listing.genres.length > 0 ? <Detail title="Tarz" values={listing.genres} /> : null}

        <View className="mt-8 flex-row items-center gap-3 rounded-xl border border-border bg-card p-4">
          <UserAvatar url={listing.user?.avatar_url} name={listing.user?.username} size={44} />
          <View className="flex-1">
            <Text className="font-bold text-text">
              {listing.user?.full_name || listing.user?.username || 'Müzisyen'}
            </Text>
            {listing.user?.city ? (
              <Text className="text-sm text-muted">{listing.user.city}</Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {!isOwner ? (
        <View
          className="border-t border-border px-4 pt-4"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 active:opacity-90"
            disabled={busy}
            style={{ opacity: busy ? 0.6 : 1 }}
            onPress={message}
          >
            {busy ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
                <Text className="font-semibold text-text">Mesaj At</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

function Meta({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-border px-3 py-1">
      <Ionicons name={icon} size={12} color={colors.textSecondary} />
      <Text className="text-xs font-medium text-text-secondary">{label}</Text>
    </View>
  )
}

function Detail({ title, values }: { title: string; values: string[] }) {
  return (
    <View className="mt-6">
      <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {values.map((value) => (
          <View key={value} className="rounded-full bg-border px-3 py-1">
            <Text className="text-xs font-medium text-text-secondary">{value}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
