import { useCallback, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, Text, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import type { ViewToken } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { incrementViewCount } from '@stagein/supabase'
import type { Video } from '@stagein/shared'
import { FilterSheet, type FilterValues } from '@/components/FilterSheet'
import { VideoCard } from '@/components/VideoCard'
import { getOrCreateConversation } from '@/lib/api'
import { colors, TAB_BAR_HEIGHT } from '@/lib/theme'
import { useVideoFeed } from '@/hooks/useVideoFeed'
import { useAuthStore } from '@/stores/authStore'
import { useFeedStore } from '@/stores/feedStore'

export default function KesfetScreen() {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const itemHeight = height - (TAB_BAR_HEIGHT + insets.bottom)

  const { videos, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useVideoFeed()

  const session = useAuthStore((s) => s.session)
  const activeIndex = useFeedStore((s) => s.activeIndex)
  const setActiveIndex = useFeedStore((s) => s.setActiveIndex)
  const markViewed = useFeedStore((s) => s.markViewed)
  const muted = useFeedStore((s) => s.muted)
  const toggleMuted = useFeedStore((s) => s.toggleMuted)
  const cityFilter = useFeedStore((s) => s.cityFilter)
  const setCityFilter = useFeedStore((s) => s.setCityFilter)

  const [filterVisible, setFilterVisible] = useState(false)
  const [busy, setBusy] = useState(false)

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0]
    if (!first || first.index === null) return
    setActiveIndex(first.index)
    const video = first.item as Video
    if (markViewed(video.id)) void incrementViewCount(video.id)
  }).current

  const openMessage = useCallback(
    async (video: Video) => {
      if (!session) {
        router.push('/(auth)/giris')
        return
      }
      if (video.user_id === session.user.id || busy) return
      setBusy(true)
      try {
        const conversation = await getOrCreateConversation(session.user.id, video.user_id)
        router.push({
          pathname: '/(tabs)/mesajlar/[id]',
          params: { id: conversation.id, contextType: 'video', contextId: video.id },
        })
      } finally {
        setBusy(false)
      }
    },
    [session, busy]
  )

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-dark">
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-dark px-6">
        <Text className="text-center text-base text-text-secondary">Akış yüklenemedi.</Text>
        <Pressable className="mt-4 rounded-lg bg-primary px-6 py-3" onPress={() => refetch()}>
          <Text className="font-semibold text-text">Tekrar dene</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-dark">
      {videos.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-2xl font-bold text-text">Henüz video yok</Text>
          <Text className="mt-2 text-center text-base text-text-secondary">
            {cityFilter ? `${cityFilter} için sonuç bulunamadı.` : 'İlk videoyu sen yükle.'}
          </Text>
        </View>
      ) : (
        <FlashList
          data={videos}
          keyExtractor={(item) => item.id}
          estimatedItemSize={itemHeight}
          pagingEnabled
          snapToInterval={itemHeight}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
          }}
          renderItem={({ item, index }) => (
            <VideoCard
              video={item}
              height={itemHeight}
              isActive={index === activeIndex}
              muted={muted}
              onToggleMuted={toggleMuted}
              onPressMessage={() => void openMessage(item)}
              onPressProfile={() => {
                if (!session) router.push('/(auth)/giris')
              }}
            />
          )}
        />
      )}

      <View
        className="absolute left-4 right-4 flex-row items-center justify-between"
        style={{ top: insets.top + 8 }}
      >
        <Text className="text-2xl font-black text-text">StageIn</Text>
        <Pressable
          className="flex-row items-center gap-2 rounded-full bg-black/50 px-3 py-1.5"
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="options-outline" size={16} color={colors.text} />
          <Text className="text-xs font-medium text-text">{cityFilter ?? 'Tüm şehirler'}</Text>
        </Pressable>
      </View>

      <FilterSheet
        visible={filterVisible}
        value={{ city: cityFilter ?? undefined }}
        fields={['city']}
        onClose={() => setFilterVisible(false)}
        onApply={(value: FilterValues) => setCityFilter(value.city ?? null)}
      />
    </View>
  )
}
