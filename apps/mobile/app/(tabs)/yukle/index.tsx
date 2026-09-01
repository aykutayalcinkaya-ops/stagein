import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { CITIES, GENRES, INSTRUMENTS, MAX_VIDEO_DURATION_SECONDS } from '@stagein/shared'
import { Chip } from '@/components/FilterSheet'
import { uploadVideoFile } from '@/lib/api'
import { formatDuration } from '@/lib/format'
import { colors } from '@/lib/theme'
import { useAuthStore } from '@/stores/authStore'

type Draft = { uri: string; duration: number | null }

export default function YukleScreen() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)
  const musicianProfile = useAuthStore((s) => s.musicianProfile)

  const [draft, setDraft] = useState<Draft | null>(null)
  const [recording, setRecording] = useState(false)
  const [city, setCity] = useState<string | null>(profile?.city ?? null)
  const [instruments, setInstruments] = useState<string[]>(musicianProfile?.instruments ?? [])
  const [genres, setGenres] = useState<string[]>(musicianProfile?.genres ?? [])
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  function toggle(list: string[], setList: (next: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  async function pickFromLibrary() {
    setError(null)
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setError('Galeri izni verilmedi')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
      videoMaxDuration: MAX_VIDEO_DURATION_SECONDS,
    })
    if (result.canceled) return

    const asset = result.assets[0]
    const seconds = asset.duration ? asset.duration / 1000 : null
    if (seconds && seconds > MAX_VIDEO_DURATION_SECONDS + 0.5) {
      setError(`Video en fazla ${MAX_VIDEO_DURATION_SECONDS} saniye olabilir`)
      return
    }
    if (asset.width && asset.height && asset.width > asset.height) {
      setError('Yalnızca dikey (9:16) video yükleyebilirsin')
      return
    }
    setDraft({ uri: asset.uri, duration: seconds ? Math.round(seconds) : null })
  }

  async function upload() {
    if (!draft || !session) return
    setProgress(0)
    setError(null)
    try {
      await uploadVideoFile({
        userId: session.user.id,
        uri: draft.uri,
        metadata: { city, instruments, genres, duration: draft.duration },
        onProgress: setProgress,
      })
      await queryClient.invalidateQueries({ queryKey: ['feed'] })
      setDraft(null)
      setProgress(null)
      Alert.alert('Yüklendi', 'Videon işleniyor, birazdan akışta görünecek.')
      router.replace('/(tabs)/kesfet')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video yüklenemedi')
      setProgress(null)
    }
  }

  if (recording) {
    return (
      <Recorder
        onCancel={() => setRecording(false)}
        onRecorded={(uri, seconds) => {
          setDraft({ uri, duration: seconds })
          setRecording(false)
        }}
      />
    )
  }

  if (!draft) {
    return (
      <View className="flex-1 bg-dark px-6" style={{ paddingTop: insets.top + 24 }}>
        <Text className="text-4xl font-black text-text">Video Yükle</Text>
        <Text className="mt-2 text-base text-text-secondary">
          Dikey, en fazla {MAX_VIDEO_DURATION_SECONDS} saniye. Tek çekim, gerçek ses.
        </Text>

        <View className="mt-10 gap-3">
          <Pressable
            className="flex-row items-center gap-4 rounded-xl border border-border bg-card p-5 active:opacity-90"
            onPress={() => setRecording(true)}
          >
            <Ionicons name="videocam" size={22} color={colors.primary} />
            <View className="flex-1">
              <Text className="font-bold text-text">Kamerayla kaydet</Text>
              <Text className="mt-1 text-xs text-muted">Uygulama içinde çek</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <Pressable
            className="flex-row items-center gap-4 rounded-xl border border-border bg-card p-5 active:opacity-90"
            onPress={pickFromLibrary}
          >
            <Ionicons name="images" size={22} color={colors.accent} />
            <View className="flex-1">
              <Text className="font-bold text-text">Galeriden seç</Text>
              <Text className="mt-1 text-xs text-muted">Hazır videonu yükle</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        </View>

        {error ? <Text className="mt-6 text-sm text-accent">{error}</Text> : null}
      </View>
    )
  }

  const uploading = progress !== null

  return (
    <View className="flex-1 bg-dark">
      <View className="flex-row items-center gap-3 px-4 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <Pressable
          className="h-10 w-10 justify-center"
          disabled={uploading}
          onPress={() => setDraft(null)}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-bold text-text">Detaylar</Text>
      </View>

      <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 24 }}>
        <Preview uri={draft.uri} duration={draft.duration} />

        <Section title="Şehir">
          {CITIES.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={city === option}
              onPress={() => setCity(city === option ? null : option)}
            />
          ))}
        </Section>

        <Section title="Enstrüman">
          {INSTRUMENTS.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={instruments.includes(option)}
              onPress={() => toggle(instruments, setInstruments, option)}
            />
          ))}
        </Section>

        <Section title="Tarz">
          {GENRES.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={genres.includes(option)}
              onPress={() => toggle(genres, setGenres, option)}
            />
          ))}
        </Section>

        {error ? <Text className="mt-4 text-sm text-accent">{error}</Text> : null}
      </ScrollView>

      <View className="border-t border-border px-4 pt-4" style={{ paddingBottom: insets.bottom + 12 }}>
        {uploading ? (
          <View>
            <View className="h-1 overflow-hidden rounded-full bg-border">
              <View
                className="h-full bg-primary"
                style={{ width: `${Math.round((progress ?? 0) * 100)}%` }}
              />
            </View>
            <Text className="mt-2 text-center text-xs text-muted">
              Yükleniyor %{Math.round((progress ?? 0) * 100)}
            </Text>
          </View>
        ) : (
          <Pressable
            className="items-center rounded-lg bg-primary px-6 py-3 active:opacity-90"
            onPress={upload}
          >
            <Text className="font-semibold text-text">Paylaş</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

function Preview({ uri, duration }: { uri: string; duration: number | null }) {
  const { width } = useWindowDimensions()
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true
    instance.muted = true
    instance.play()
  })

  const previewWidth = width - 32
  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card">
      <VideoView
        player={player}
        style={{ width: previewWidth, height: Math.min((previewWidth * 16) / 9, 360) }}
        contentFit="cover"
        nativeControls={false}
      />
      {duration ? (
        <View className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-1">
          <Text className="text-xs text-text">{formatDuration(duration)}</Text>
        </View>
      ) : null}
    </View>
  )
}

function Recorder({
  onCancel,
  onRecorded,
}: {
  onCancel: () => void
  onRecorded: (uri: string, seconds: number) => void
}) {
  const insets = useSafeAreaInsets()
  const cameraRef = useRef<CameraView>(null)
  const [cameraPermission, requestCamera] = useCameraPermissions()
  const [micPermission, requestMic] = useMicrophonePermissions()
  const [facing, setFacing] = useState<'front' | 'back'>('back')
  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  // recordAsync beklerken state kapanışı eskir; süreyi ref'ten okuyoruz
  const elapsedRef = useRef(0)

  useEffect(() => {
    if (!isRecording) return
    const timer = setInterval(() => {
      elapsedRef.current += 1
      setElapsed(elapsedRef.current)
    }, 1000)
    return () => clearInterval(timer)
  }, [isRecording])

  const granted = cameraPermission?.granted && micPermission?.granted

  if (!granted) {
    return (
      <View className="flex-1 items-center justify-center bg-dark px-6">
        <Ionicons name="videocam-outline" size={40} color={colors.muted} />
        <Text className="mt-6 text-center text-xl font-bold text-text">Kamera izni gerekiyor</Text>
        <Text className="mt-2 text-center text-sm text-text-secondary">
          Video kaydı için kamera ve mikrofon erişimine ihtiyacımız var.
        </Text>
        <Pressable
          className="mt-6 rounded-lg bg-primary px-6 py-3"
          onPress={async () => {
            await requestCamera()
            await requestMic()
          }}
        >
          <Text className="font-semibold text-text">İzin ver</Text>
        </Pressable>
        <Pressable className="mt-3 px-6 py-3" onPress={onCancel}>
          <Text className="text-sm text-muted">Vazgeç</Text>
        </Pressable>
      </View>
    )
  }

  async function toggleRecording() {
    if (!cameraRef.current) return
    if (isRecording) {
      cameraRef.current.stopRecording()
      return
    }
    setIsRecording(true)
    elapsedRef.current = 0
    setElapsed(0)
    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_VIDEO_DURATION_SECONDS,
      })
      if (video?.uri) {
        onRecorded(video.uri, Math.min(elapsedRef.current || 1, MAX_VIDEO_DURATION_SECONDS))
      }
    } finally {
      setIsRecording(false)
    }
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} mode="video" videoQuality="1080p" />

      <View
        className="absolute left-0 right-0 flex-row items-center justify-between px-6"
        style={{ top: insets.top + 12 }}
      >
        <Pressable onPress={onCancel} disabled={isRecording}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
        {isRecording ? (
          <View className="flex-row items-center gap-2 rounded-full bg-black/60 px-3 py-1">
            <View className="h-2 w-2 rounded-full bg-accent" />
            <Text className="text-xs font-medium text-text">{formatDuration(elapsed)}</Text>
          </View>
        ) : null}
        <Pressable
          onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
          disabled={isRecording}
        >
          <Ionicons name="camera-reverse-outline" size={26} color={colors.text} />
        </Pressable>
      </View>

      <View className="absolute left-0 right-0 items-center" style={{ bottom: insets.bottom + 32 }}>
        <Pressable
          className="h-20 w-20 items-center justify-center rounded-full border-4 border-white/80"
          onPress={toggleRecording}
        >
          <View
            className={isRecording ? 'h-7 w-7 rounded bg-accent' : 'h-14 w-14 rounded-full bg-accent'}
          />
        </Pressable>
        <Text className="mt-3 text-xs text-white/60">
          En fazla {MAX_VIDEO_DURATION_SECONDS} sn
        </Text>
      </View>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="py-4">
      <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{title}</Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  )
}
