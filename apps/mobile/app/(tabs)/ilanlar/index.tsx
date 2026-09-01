import { useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { ListingCard } from '@/components/ListingCard'
import { FilterSheet, type FilterValues } from '@/components/FilterSheet'
import { useListings } from '@/hooks/useListings'
import { useAuthStore } from '@/stores/authStore'
import { colors } from '@/lib/theme'

export default function IlanlarScreen() {
  const insets = useSafeAreaInsets()
  const isGuest = useAuthStore((s) => s.status !== 'authenticated')
  const [filters, setFilters] = useState<FilterValues>({})
  const [filterVisible, setFilterVisible] = useState(false)

  const { listings, isLoading, isRefetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useListings(filters)

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <View className="flex-1 bg-dark" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-4">
        <Text className="text-3xl font-black text-text">İlanlar</Text>
        <Pressable
          className="flex-row items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="options-outline" size={16} color={colors.text} />
          <Text className="text-xs font-medium text-text">
            {activeFilterCount > 0 ? `Filtre (${activeFilterCount})` : 'Filtrele'}
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.muted} />
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
          }}
          ListEmptyComponent={
            <View className="items-center py-24">
              <Text className="text-center text-xl font-bold text-text">İlan bulunamadı</Text>
              <Text className="mt-2 text-center text-sm text-text-secondary">
                Filtreleri değiştir ya da ilk ilanı sen aç.
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator className="py-6" color={colors.muted} /> : null
          }
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => router.push({ pathname: '/(tabs)/ilanlar/[id]', params: { id: item.id } })}
            />
          )}
        />
      )}

      <Pressable
        className="absolute right-5 flex-row items-center gap-2 rounded-lg bg-primary px-5 py-3 active:opacity-90"
        style={{ bottom: 24 }}
        onPress={() =>
          isGuest ? router.push('/(auth)/giris') : router.push('/(tabs)/ilanlar/olustur')
        }
      >
        <Ionicons name="add" size={18} color={colors.text} />
        <Text className="font-semibold text-text">İlan Aç</Text>
      </Pressable>

      <FilterSheet
        visible={filterVisible}
        value={filters}
        fields={['type', 'city', 'instrument']}
        onClose={() => setFilterVisible(false)}
        onApply={setFilters}
      />
    </View>
  )
}
