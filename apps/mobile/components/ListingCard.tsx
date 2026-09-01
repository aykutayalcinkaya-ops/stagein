import { Ionicons } from '@expo/vector-icons'
import { Pressable, Text, View } from 'react-native'
import type { Listing } from '@stagein/shared'
import { UserAvatar } from '@/components/UserAvatar'
import { EXPERIENCE_LABELS, LISTING_TYPE_LABELS, formatRelativeTime } from '@/lib/format'
import { colors } from '@/lib/theme'

interface Props {
  listing: Listing
  onPress: () => void
}

export function ListingCard({ listing, onPress }: Props) {
  const tags = [...listing.instruments, ...listing.genres].slice(0, 3)

  return (
    <Pressable
      className="rounded-xl border border-border bg-card p-4 active:opacity-90"
      onPress={onPress}
    >
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

      <Text className="mt-3 text-lg font-bold text-text" numberOfLines={2}>
        {listing.title}
      </Text>

      {listing.description ? (
        <Text className="mt-1 text-sm text-text-secondary" numberOfLines={2}>
          {listing.description}
        </Text>
      ) : null}

      {tags.length > 0 ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {tags.map((tag) => (
            <View key={tag} className="rounded-full bg-border px-3 py-1">
              <Text className="text-xs font-medium text-text-secondary">{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="mt-4 flex-row items-center gap-2 border-t border-border pt-3">
        <UserAvatar url={listing.user?.avatar_url} name={listing.user?.username} size={24} />
        <Text className="text-sm text-text-secondary" numberOfLines={1}>
          {listing.user?.full_name || listing.user?.username || 'Müzisyen'}
        </Text>
        {listing.city ? (
          <View className="ml-auto flex-row items-center gap-1">
            <Ionicons name="location-outline" size={14} color={colors.muted} />
            <Text className="text-xs text-muted">{listing.city}</Text>
          </View>
        ) : null}
      </View>

      {listing.experience_level ? (
        <Text className="mt-2 text-xs text-muted">
          Seviye: {EXPERIENCE_LABELS[listing.experience_level]}
        </Text>
      ) : null}
    </Pressable>
  )
}
