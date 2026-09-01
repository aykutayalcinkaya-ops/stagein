import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { UserAvatar } from '@/components/UserAvatar'
import { fetchMyListings, fetchUserVideos } from '@/lib/api'
import { EXPERIENCE_LABELS, LISTING_TYPE_LABELS, formatCount } from '@/lib/format'
import { colors } from '@/lib/theme'
import { useAuthStore } from '@/stores/authStore'

export default function ProfilScreen() {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const profile = useAuthStore((s) => s.profile)
  const musicianProfile = useAuthStore((s) => s.musicianProfile)
  const userId = profile?.id ?? null

  const { data: videos, isLoading } = useQuery({
    queryKey: ['user-videos', userId],
    queryFn: () => fetchUserVideos(userId!),
    enabled: Boolean(userId),
  })

  const { data: listings } = useQuery({
    queryKey: ['my-listings', userId],
    queryFn: () => fetchMyListings(userId!),
    enabled: Boolean(userId),
  })

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-dark px-6">
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  const tileSize = (width - 32 - 8) / 3
  const totalViews = (videos ?? []).reduce((sum, video) => sum + video.view_count, 0)

  return (
    <ScrollView className="flex-1 bg-dark" contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="px-4" style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-3xl font-black text-text">Profil</Text>
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-lg border border-border bg-card"
            onPress={() => router.push('/(tabs)/profil/ayarlar')}
          >
            <Ionicons name="settings-outline" size={18} color={colors.text} />
          </Pressable>
        </View>

        <View className="mt-6 flex-row items-center gap-4">
          <UserAvatar url={profile.avatar_url} name={profile.full_name ?? profile.username} size={72} />
          <View className="flex-1">
            <Text className="text-2xl font-extrabold text-text" numberOfLines={1}>
              {profile.full_name || profile.username}
            </Text>
            <Text className="text-sm text-muted">@{profile.username}</Text>
            {profile.city ? (
              <View className="mt-1 flex-row items-center gap-1">
                <Ionicons name="location-outline" size={12} color={colors.muted} />
                <Text className="text-xs text-muted">{profile.city}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {profile.bio ? (
          <Text className="mt-4 text-base leading-6 text-text-secondary">{profile.bio}</Text>
        ) : null}

        <View className="mt-5 flex-row gap-6">
          <Stat label="Video" value={formatCount(videos?.length ?? 0)} />
          <Stat label="İzlenme" value={formatCount(totalViews)} />
          <Stat label="İlan" value={formatCount(listings?.length ?? 0)} />
        </View>

        {musicianProfile ? (
          <View className="mt-5 gap-3">
            <View className="flex-row flex-wrap gap-2">
              {musicianProfile.instruments.map((instrument) => (
                <View key={instrument} className="rounded-full bg-border px-3 py-1">
                  <Text className="text-xs font-medium text-text-secondary">{instrument}</Text>
                </View>
              ))}
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-muted">
                {EXPERIENCE_LABELS[musicianProfile.experience_level]}
              </Text>
              {musicianProfile.is_open_to_gig ? (
                <View className="rounded-full bg-primary/20 px-3 py-1">
                  <Text className="text-xs font-medium text-primary">İşe açık</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>

      <Text className="px-4 pb-3 pt-8 text-sm font-semibold uppercase tracking-wide text-muted">
        Videolarım
      </Text>

      {isLoading ? (
        <ActivityIndicator className="py-8" color={colors.muted} />
      ) : (videos ?? []).length === 0 ? (
        <View className="mx-4 items-center rounded-xl border border-border bg-card px-6 py-10">
          <Text className="text-center text-base font-bold text-text">Henüz video yok</Text>
          <Pressable
            className="mt-4 rounded-lg bg-primary px-5 py-2.5"
            onPress={() => router.push('/(tabs)/yukle')}
          >
            <Text className="text-sm font-semibold text-text">İlk videonu yükle</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-1 px-4">
          {(videos ?? []).map((video) => (
            <View
              key={video.id}
              className="items-center justify-center overflow-hidden border border-border bg-card"
              style={{ width: tileSize, height: tileSize * 1.4 }}
            >
              {video.thumbnail_url ? (
                <Image source={{ uri: video.thumbnail_url }} style={{ flex: 1, width: '100%' }} contentFit="cover" />
              ) : (
                <Ionicons name="musical-notes-outline" size={22} color={colors.muted} />
              )}
              <View className="absolute bottom-1 left-1 flex-row items-center gap-1 rounded bg-black/60 px-1.5 py-0.5">
                <Ionicons name="play" size={9} color={colors.text} />
                <Text className="text-[10px] text-text">{formatCount(video.view_count)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {(listings ?? []).length > 0 ? (
        <>
          <Text className="px-4 pb-3 pt-8 text-sm font-semibold uppercase tracking-wide text-muted">
            İlanlarım
          </Text>
          <View className="gap-2 px-4">
            {(listings ?? []).map((listing) => (
              <Pressable
                key={listing.id}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-4 active:opacity-90"
                onPress={() =>
                  router.push({ pathname: '/(tabs)/ilanlar/[id]', params: { id: listing.id } })
                }
              >
                <View className="flex-1">
                  <Text className="font-semibold text-text" numberOfLines={1}>
                    {listing.title}
                  </Text>
                  <Text className="mt-1 text-xs text-muted">
                    {LISTING_TYPE_LABELS[listing.type]} · {listing.status === 'active' ? 'Yayında' : 'Kapalı'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-xl font-extrabold text-text">{value}</Text>
      <Text className="text-xs text-muted">{label}</Text>
    </View>
  )
}
