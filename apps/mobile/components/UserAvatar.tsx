import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Text, View } from 'react-native'
import type { BadgeType } from '@stagein/shared'
import { colors } from '@/lib/theme'

interface Props {
  url?: string | null
  name?: string | null
  size?: number
  badge?: BadgeType | null
}

/** Avatar + rozet. Görsel yoksa baş harfe düşer. */
export function UserAvatar({ url, name, size = 40, badge }: Props) {
  const initial = (name ?? '?').trim().charAt(0).toUpperCase()
  const badgeSize = Math.max(14, size * 0.36)

  return (
    <View style={{ width: size, height: size }}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          transition={120}
        />
      ) : (
        <View
          className="items-center justify-center border border-border bg-card"
          style={{ width: size, height: size, borderRadius: size / 2 }}
        >
          <Text className="font-bold text-text" style={{ fontSize: size * 0.4 }}>
            {initial}
          </Text>
        </View>
      )}

      {badge ? (
        <View
          className="absolute -bottom-0.5 -right-0.5 items-center justify-center rounded-full border-2 border-dark"
          style={{
            width: badgeSize,
            height: badgeSize,
            backgroundColor: badge === 'blue' ? colors.primary : colors.muted,
          }}
        >
          <Ionicons name="checkmark" size={badgeSize * 0.6} color={colors.text} />
        </View>
      ) : null}
    </View>
  )
}
