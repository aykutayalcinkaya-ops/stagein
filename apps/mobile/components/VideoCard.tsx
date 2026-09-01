import { useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Pressable, Text, View } from 'react-native'
import type { Video } from '@stagein/shared'
import { UserAvatar } from '@/components/UserAvatar'
import { videoSource } from '@/lib/api'
import { formatCount } from '@/lib/format'
import { colors } from '@/lib/theme'

interface Props {
  video: Video
  height: number
  /** Ekranda görünen tek kart oynar — akış performansı buna bağlı */
  isActive: boolean
  muted: boolean
  onToggleMuted: () => void
  onPressMessage: () => void
  onPressProfile: () => void
}

export function VideoCard({
  video,
  height,
  isActive,
  muted,
  onToggleMuted,
  onPressMessage,
  onPressProfile,
}: Props) {
  const player = useVideoPlayer(videoSource(video), (instance) => {
    instance.loop = true
    instance.muted = muted
  })

  useEffect(() => {
    if (isActive) player.play()
    else player.pause()
  }, [isActive, player])

  useEffect(() => {
    player.muted = muted
  }, [muted, player])

  const displayName = video.user?.full_name || video.user?.username || 'Müzisyen'
  const tags = [...video.instruments, ...video.genres].slice(0, 3)

  return (
    <View style={{ height }} className="w-full bg-dark">
      <Pressable className="absolute inset-0" onPress={onToggleMuted}>
        <VideoView
          player={player}
          style={{ flex: 1 }}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
        />
      </Pressable>

      {/* Overlay UI: %40 siyah gradient, video kenara kadar dolar */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
        locations={[0.45, 0.7, 1]}
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%' }}
      />

      {muted ? (
        <View className="absolute right-4 top-16 rounded-full bg-black/50 p-2" pointerEvents="none">
          <Ionicons name="volume-mute" size={18} color={colors.text} />
        </View>
      ) : null}

      <View className="absolute bottom-6 left-4 right-4 gap-3">
        <Pressable className="flex-row items-center gap-3" onPress={onPressProfile}>
          <UserAvatar url={video.user?.avatar_url} name={displayName} size={44} />
          <View className="flex-1">
            <Text className="text-lg font-extrabold text-text" numberOfLines={1}>
              {displayName}
            </Text>
            {video.city ? <Text className="text-sm text-text-secondary">{video.city}</Text> : null}
          </View>
        </Pressable>

        {tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {tags.map((tag) => (
              <View key={tag} className="rounded-full bg-border px-3 py-1">
                <Text className="text-xs font-medium text-text-secondary">{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View className="flex-row items-center gap-4">
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 active:opacity-90"
            onPress={onPressMessage}
          >
            <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
            <Text className="font-semibold text-text">Mesaj At</Text>
          </Pressable>

          <View className="flex-row items-center gap-1">
            <Ionicons name="heart" size={16} color={colors.accent} />
            <Text className="text-sm text-text-secondary">{formatCount(video.like_count)}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="play" size={16} color={colors.muted} />
            <Text className="text-sm text-text-secondary">{formatCount(video.view_count)}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
