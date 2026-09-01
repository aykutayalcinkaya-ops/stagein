import { useState } from 'react'
import {
  ActivityIndicator,
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
import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { createListing } from '@stagein/supabase'
import { CITIES, GENRES, INSTRUMENTS } from '@stagein/shared'
import type { ExperienceLevel, ListingType } from '@stagein/shared'
import { Chip } from '@/components/FilterSheet'
import { EXPERIENCE_LABELS, LISTING_TYPE_LABELS } from '@/lib/format'
import { colors } from '@/lib/theme'
import { useAuthStore } from '@/stores/authStore'

const TYPES: ListingType[] = ['band', 'session', 'lesson']
const LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'professional']

export default function IlanOlusturScreen() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)

  const [type, setType] = useState<ListingType>('band')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState<string | null>(profile?.city ?? null)
  const [instruments, setInstruments] = useState<string[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [experience, setExperience] = useState<ExperienceLevel | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = title.trim().length >= 5 && city !== null && !saving

  function toggle(list: string[], setList: (next: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  async function submit() {
    if (!session) return
    setSaving(true)
    setError(null)
    try {
      await createListing({
        user_id: session.user.id,
        type,
        title: title.trim(),
        description: description.trim() || null,
        city,
        instruments,
        genres,
        experience_level: experience,
        is_paid: isPaid,
      })
      await queryClient.invalidateQueries({ queryKey: ['listings'] })
      router.back()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İlan oluşturulamadı')
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-row items-center gap-3 px-4 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <Pressable className="h-10 w-10 justify-center" onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-bold text-text">İlan Aç</Text>
      </View>

      <ScrollView className="px-4" keyboardShouldPersistTaps="handled">
        <Section title="İlan Türü">
          {TYPES.map((option) => (
            <Chip
              key={option}
              label={LISTING_TYPE_LABELS[option]}
              selected={type === option}
              onPress={() => setType(option)}
            />
          ))}
        </Section>

        <View className="gap-3 py-2">
          <TextInput
            className="rounded-lg border border-border bg-card px-4 py-3 text-white"
            placeholder="Başlık — örn. Rock grubuna basçı aranıyor"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            className="min-h-[120px] rounded-lg border border-border bg-card px-4 py-3 text-white"
            placeholder="Detaylar: prova sıklığı, beklentiler, repertuar..."
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
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

        <Section title="Aranan Seviye">
          {LEVELS.map((option) => (
            <Chip
              key={option}
              label={EXPERIENCE_LABELS[option]}
              selected={experience === option}
              onPress={() => setExperience(experience === option ? null : option)}
            />
          ))}
        </Section>

        <View className="mt-2 flex-row items-center justify-between rounded-xl border border-border bg-card p-4">
          <View className="flex-1 pr-4">
            <Text className="font-semibold text-text">Ücretli iş</Text>
            <Text className="mt-1 text-xs text-muted">
              Session, ders veya ücretli sahne işi ise açık bırak.
            </Text>
          </View>
          <Switch
            value={isPaid}
            onValueChange={setIsPaid}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>

        {error ? <Text className="mt-4 text-sm text-accent">{error}</Text> : null}
        <View className="h-8" />
      </ScrollView>

      <View className="border-t border-border px-4 pt-4" style={{ paddingBottom: insets.bottom + 12 }}>
        <Pressable
          className="items-center rounded-lg bg-primary px-6 py-3 active:opacity-90"
          disabled={!canSubmit}
          style={{ opacity: canSubmit ? 1 : 0.5 }}
          onPress={submit}
        >
          {saving ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text className="font-semibold text-text">Yayınla</Text>
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
