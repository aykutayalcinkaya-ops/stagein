import { useEffect, useRef, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import type { Message } from '@stagein/shared'
import { formatDuration, formatRelativeTime } from '@/lib/format'
import { colors } from '@/lib/theme'

interface Props {
  message: Message
  isOwn: boolean
}

export function MessageBubble({ message, isOwn }: Props) {
  return (
    <View className={`mb-2 max-w-[80%] ${isOwn ? 'self-end' : 'self-start'}`}>
      <View
        className={`rounded-xl border px-4 py-3 ${
          isOwn ? 'border-primary bg-primary' : 'border-border bg-card'
        }`}
      >
        {message.audio_url ? (
          <AudioNote url={message.audio_url} isOwn={isOwn} />
        ) : (
          <Text className={isOwn ? 'text-text' : 'text-text-secondary'}>{message.content}</Text>
        )}
      </View>
      <Text className={`mt-1 text-[11px] text-muted ${isOwn ? 'text-right' : ''}`}>
        {formatRelativeTime(message.created_at)}
      </Text>
    </View>
  )
}

function AudioNote({ url, isOwn }: { url: string; isOwn: boolean }) {
  const soundRef = useRef<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [positionMs, setPositionMs] = useState(0)
  const [durationMs, setDurationMs] = useState(0)

  useEffect(() => {
    return () => {
      void soundRef.current?.unloadAsync()
    }
  }, [])

  async function toggle() {
    if (soundRef.current) {
      const status = await soundRef.current.getStatusAsync()
      if (status.isLoaded && status.isPlaying) {
        await soundRef.current.pauseAsync()
        setIsPlaying(false)
      } else {
        await soundRef.current.playAsync()
        setIsPlaying(true)
      }
      return
    }

    setIsLoading(true)
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true })
      soundRef.current = sound
      setIsPlaying(true)
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return
        setPositionMs(status.positionMillis)
        setDurationMs(status.durationMillis ?? 0)
        if (status.didJustFinish) {
          setIsPlaying(false)
          setPositionMs(0)
          void sound.setPositionAsync(0)
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const progress = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0
  const tint = isOwn ? colors.text : colors.primary

  return (
    <Pressable className="w-48 flex-row items-center gap-3" onPress={toggle}>
      {isLoading ? (
        <ActivityIndicator size="small" color={tint} />
      ) : (
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={tint} />
      )}
      <View className="flex-1">
        <View className="h-1 overflow-hidden rounded-full bg-black/30">
          <View style={{ width: `${progress * 100}%`, backgroundColor: tint }} className="h-full" />
        </View>
        <Text className={`mt-1 text-[11px] ${isOwn ? 'text-text' : 'text-muted'}`}>
          {formatDuration((durationMs > 0 ? durationMs - positionMs : 0) / 1000)}
        </Text>
      </View>
    </Pressable>
  )
}
