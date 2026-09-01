import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
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
import { uploadAvatar, upsertMusicianProfile, upsertUser } from '@/lib/api'
import { EXPERIENCE_LABELS } from '@/lib/format'
import { colors } from '@/lib/theme'
import { useAuthStore } from '@/stores/authStore'

const LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'professional']

export default function AyarlarScreen() {
  const insets = useSafeAreaInsets()
  const profile = useAuthStore((s) => s.profile)
  const musicianProfile = useAuthStore((s) => s.musicianProfile)
  const refreshProfile = useAuthStore((s) => s.refreshProfile)
  const signOut = useAuthStore((s) => s.signOut)

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [city, setCity] = useState<string | null>(profile?.city ?? null)
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [instruments, setInstruments] = useState<string[]>(musicianProfile?.instruments ?? [])
  const [genres, setGenres] = useState<string[]>(musicianProfile?.genres ?? [])
  const [experience, setExperience] = useState<ExperienceLevel>(
    musicianProfile?.experience_level ?? 'beginner'
  )
  const [openToGig, setOpenToGig] = useState(musicianProfile?.is_open_to_gig ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(list: string[], setList: (next: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled) setAvatarUri(result.assets[0].uri)
  }

  async function save() {
    if (!profile) return
    setSaving(true)
    setError(null)
    try {
      const avatarUrl = avatarUri ? await uploadAvatar(profile.id, avatarUri) : profile.avatar_url
      await upsertUser({
        id: profile.id,
        email: profile.email,
        username: profile.username,
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        city,
        avatar_url: avatarUrl,
      })
      await upsertMusicianProfile({
        user_id: profile.id,
        instruments,
        genres,
        experience_level: experience,
        is_open_to_gig: openToGig,
      })
      await refreshProfile()
      router.back()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  function confirmSignOut() {
    Alert.alert('Çıkış yap', 'Hesabından çıkmak istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış yap',
        style: 'destructive',
        onPress: async () => {
          await signOut()
          router.replace('/')
        },
      },
    ])
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-row items-center gap-3 px-4 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <Pressable className="h-10 w-10 justify-center" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-bold text-text">Ayarlar</Text>
      </View>

      <ScrollView className="px-4" keyboardShouldPersistTaps="handled">
        <Pressable className="items-center py-4" onPress={pickAvatar}>
          <UserAvatar
            url={avatarUri ?? profile?.avatar_url}
            name={fullName || profile?.username}
            size={88}
          />
          <Text className="mt-3 text-sm font-semibold text-primary">Fotoğrafı değiştir</Text>
        </Pressable>

        <View className="gap-3">
          <TextInput
            className="rounded-lg border border-border bg-card px-4 py-3 text-white"
            placeholder="Ad Soyad"
            placeholderTextColor={colors.muted}
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            className="min-h-[100px] rounded-lg border border-border bg-card px-4 py-3 text-white"
            placeholder="Kendinden bahset — ne çalıyorsun, nerede çaldın?"
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            value={bio}
            onChangeText={setBio}
          />
        </View>

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

        <Section title="Seviye">
          {LEVELS.map((option) => (
            <Chip
              key={option}
              label={EXPERIENCE_LABELS[option]}
              selected={experience === option}
              onPress={() => setExperience(option)}
            />
          ))}
        </Section>

        <View className="flex-row items-center justify-between rounded-xl border border-border bg-card p-4">
          <View className="flex-1 pr-4">
            <Text className="font-semibold text-text">İşe açığım</Text>
            <Text className="mt-1 text-xs text-muted">
              Grup, session ve ders tekliflerine açık görün.
            </Text>
          </View>
          <Switch
            value={openToGig}
            onValueChange={setOpenToGig}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>

        {error ? <Text className="mt-4 text-sm text-accent">{error}</Text> : null}

        <Pressable className="mt-8 items-center py-4" onPress={confirmSignOut}>
          <Text className="text-sm font-semibold text-accent">Çıkış yap</Text>
        </Pressable>
        <View className="h-8" />
      </ScrollView>

      <View className="border-t border-border px-4 pt-4" style={{ paddingBottom: insets.bottom + 12 }}>
        <Pressable
          className="items-center rounded-lg bg-primary px-6 py-3 active:opacity-90"
          disabled={saving}
          style={{ opacity: saving ? 0.6 : 1 }}
          onPress={save}
        >
          {saving ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text className="font-semibold text-text">Kaydet</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
