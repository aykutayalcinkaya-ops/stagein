import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { fetchConversations } from '@stagein/supabase'
import { UserAvatar } from '@/components/UserAvatar'
import { hydrateConversations } from '@/lib/api'
import { formatRelativeTime } from '@/lib/format'
import { colors } from '@/lib/theme'
import { useAuthStore } from '@/stores/authStore'

export default function MesajlarScreen() {
  const insets = useSafeAreaInsets()
  const userId = useAuthStore((s) => s.session?.user.id ?? null)

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['conversations', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const conversations = await fetchConversations(userId!)
      return hydrateConversations(conversations, userId!)
    },
  })

  return (
    <View className="flex-1 bg-dark" style={{ paddingTop: insets.top }}>
      <Text className="px-4 py-4 text-3xl font-black text-text">Mesajlar</Text>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.muted} />
          }
          ItemSeparatorComponent={() => <View className="h-px bg-border" />}
          ListEmptyComponent={
            <View className="items-center px-6 py-24">
              <Text className="text-center text-xl font-bold text-text">Henüz mesaj yok</Text>
              <Text className="mt-2 text-center text-sm text-text-secondary">
                Keşfet'te beğendiğin bir müzisyene ya da bir ilana yaz.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const other = item.participants?.[0]
            const preview = item.last_message?.audio_url
              ? '🎙 Sesli not'
              : (item.last_message?.content ?? 'Sohbeti başlat')
            return (
              <Pressable
                className="flex-row items-center gap-3 px-4 py-4 active:bg-card"
                onPress={() =>
                  router.push({ pathname: '/(tabs)/mesajlar/[id]', params: { id: item.id } })
                }
              >
                <UserAvatar url={other?.avatar_url} name={other?.username} size={48} />
                <View className="flex-1">
                  <Text className="font-bold text-text" numberOfLines={1}>
                    {other?.full_name || other?.username || 'Müzisyen'}
                  </Text>
                  <Text className="mt-0.5 text-sm text-muted" numberOfLines={1}>
                    {preview}
                  </Text>
                </View>
                <Text className="text-xs text-muted">
                  {formatRelativeTime(item.last_message_at)}
                </Text>
              </Pressable>
            )
          }}
        />
      )}
    </View>
  )
}
