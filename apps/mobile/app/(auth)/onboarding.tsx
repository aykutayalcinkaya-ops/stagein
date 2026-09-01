import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { CITIES, GENRES, INSTRUMENTS } from '@stagein/shared'
import type { ExperienceLevel } from '@stagein/shared'
import { Chip } from '@/components/FilterSheet'
import { UserAvatar } from '@/components/UserAvatar'
import { isUsernameAvailable, uploadAvatar, upsertMusicianProfile, upsertUser } from '@/lib/api'
import { EXPERIENCE_LABELS } from '@/lib/format'
import { colors } from '@/lib/theme'
import { useAuthStore } from '@/stores/authStore'

const EXPERIENCE_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'professional']
const STEPS = ['Profil', 'Şehir', 'Müzik'] as const

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const session = useAuthStore((s) => s.session)
  const refreshProfile = useAuthStore((s) => s.refreshProfile)

  const [step, setStep] = useState(0)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [city, setCity] = useState<string | null>(null)
  const [instruments, setInstruments] = useState<string[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [experience, setExperience] = useState<ExperienceLevel>('beginner')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9._]/g, '')

  function toggle(list: string[], setList: (next: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setError('Galeri izni verilmedi')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled) setAvatarUri(result.assets[0].uri)
  }

  const canContinue =
    step === 0
      ? normalizedUsername.length >= 3 && fullName.trim().length > 0
      : step === 1
        ? city !== null
        : instruments.length > 0

  async function finish() {
    if (!session) return
    setSaving(true)
    setError(null)
    try {
      const available = await isUsernameAvailable(normalizedUsername)
      if (!available) {
        setStep(0)
        setError('Bu kullanıcı adı alınmış')
        return
      }

      const avatarUrl = avatarUri ? await uploadAvatar(session.user.id, avatarUri) : null

      await upsertUser({
        id: session.user.id,
        email: session.user.email ?? '',
        username: normalizedUsername,
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
        city,
        role: 'musician',
      })
      await upsertMusicianProfile({
        user_id: session.user.id,
        instruments,
        genres,
        experience_level: experience,
        is_open_to_gig: true,
      })

      await refreshProfile()
      router.replace('/(tabs)/kesfet')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profil kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + 16 }} className="px-6">
        <View className="flex-row gap-2">
          {STEPS.map((label, index) => (
            <View
              key={label}
              className={`h-1 flex-1 rounded-full ${index <= step ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </View>
        <Text className="mt-6 text-4xl font-black text-text">
          {step === 0 ? 'Seni tanıyalım' : step === 1 ? 'Nerede çalıyorsun?' : 'Ne çalıyorsun?'}
        </Text>
      </View>

      <ScrollView className="mt-6 px-6" keyboardShouldPersistTaps="handled">
        {step === 0 ? (
          <View className="gap-4">
            <Pressable className="items-center py-2" onPress={pickAvatar}>
              <UserAvatar url={avatarUri} name={fullName || '?'} size={96} />
              <Text className="mt-3 text-sm font-semibold text-primary">
                {avatarUri ? 'Fotoğrafı değiştir' : 'Profil fotoğrafı ekle'}
              </Text>
            </Pressable>

            <TextInput
              className="rounded-lg border border-border bg-card px-4 py-3 text-white"
              placeholder="Ad Soyad"
              placeholderTextColor={colors.muted}
              value={fullName}
              onChangeText={setFullName}
            />
            <View>
              <TextInput
                className="rounded-lg border border-border bg-card px-4 py-3 text-white"
                placeholder="kullaniciadi"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
              <Text className="mt-2 text-xs text-muted">
                stagein.app/{normalizedUsername || 'kullaniciadi'}
              </Text>
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View className="flex-row flex-wrap gap-2">
            {CITIES.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={city === option}
                onPress={() => setCity(city === option ? null : option)}
              />
            ))}
          </View>
        ) : null}

        {step === 2 ? (
          <View className="gap-6">
            <View>
              <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                Enstrüman
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {INSTRUMENTS.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    selected={instruments.includes(option)}
                    onPress={() => toggle(instruments, setInstruments, option)}
                  />
                ))}
              </View>
            </View>

            <View>
              <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                Tarz
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {GENRES.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    selected={genres.includes(option)}
                    onPress={() => toggle(genres, setGenres, option)}
                  />
                ))}
              </View>
            </View>

            <View>
              <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                Seviye
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {EXPERIENCE_LEVELS.map((option) => (
                  <Chip
                    key={option}
                    label={EXPERIENCE_LABELS[option]}
                    selected={experience === option}
                    onPress={() => setExperience(option)}
                  />
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {error ? <Text className="mt-6 text-sm text-accent">{error}</Text> : null}
      </ScrollView>

      <View
        className="flex-row items-center gap-3 border-t border-border px-6 pt-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        {step > 0 ? (
          <Pressable
            className="h-12 w-12 items-center justify-center rounded-lg border border-border"
            onPress={() => setStep(step - 1)}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
        ) : null}

        <Pressable
          className="flex-1 flex-row items-center justify-center rounded-lg bg-primary px-6 py-3 active:opacity-90"
          disabled={!canContinue || saving}
          style={{ opacity: canContinue && !saving ? 1 : 0.5 }}
          onPress={() => (step === 2 ? finish() : setStep(step + 1))}
        >
          {saving ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text className="font-semibold text-text">{step === 2 ? 'Bitir' : 'Devam'}</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}
