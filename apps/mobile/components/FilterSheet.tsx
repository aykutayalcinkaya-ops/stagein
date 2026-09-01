import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CITIES, GENRES, INSTRUMENTS } from '@stagein/shared'
import type { ListingType } from '@stagein/shared'
import { LISTING_TYPE_LABELS } from '@/lib/format'

export interface FilterValues {
  city?: string
  type?: ListingType
  instrument?: string
  genre?: string
}

interface Props {
  visible: boolean
  value: FilterValues
  fields?: Array<keyof FilterValues>
  onClose: () => void
  onApply: (value: FilterValues) => void
}

const LISTING_TYPES: ListingType[] = ['band', 'session', 'lesson']

/** Alttan açılan filtre paneli — ilanlar ve keşfet ortak kullanır */
export function FilterSheet({
  visible,
  value,
  fields = ['city', 'type', 'instrument'],
  onClose,
  onApply,
}: Props) {
  const insets = useSafeAreaInsets()
  const [draft, setDraft] = useState<FilterValues>(value)

  useEffect(() => {
    if (visible) setDraft(value)
  }, [visible, value])

  function toggle<K extends keyof FilterValues>(key: K, option: FilterValues[K]) {
    setDraft((current) => ({ ...current, [key]: current[key] === option ? undefined : option }))
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60" onPress={onClose} />
      <View
        className="max-h-[75%] rounded-t-xl border-t border-border bg-card"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="flex-row items-center justify-between border-b border-border px-4 py-4">
          <Text className="text-xl font-bold text-text">Filtrele</Text>
          <Pressable onPress={() => setDraft({})}>
            <Text className="text-sm text-muted">Temizle</Text>
          </Pressable>
        </View>

        <ScrollView className="px-4">
          {fields.includes('type') ? (
            <Section title="İlan Türü">
              {LISTING_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={LISTING_TYPE_LABELS[type]}
                  selected={draft.type === type}
                  onPress={() => toggle('type', type)}
                />
              ))}
            </Section>
          ) : null}

          {fields.includes('city') ? (
            <Section title="Şehir">
              {CITIES.map((city) => (
                <Chip
                  key={city}
                  label={city}
                  selected={draft.city === city}
                  onPress={() => toggle('city', city)}
                />
              ))}
            </Section>
          ) : null}

          {fields.includes('instrument') ? (
            <Section title="Enstrüman">
              {INSTRUMENTS.map((instrument) => (
                <Chip
                  key={instrument}
                  label={instrument}
                  selected={draft.instrument === instrument}
                  onPress={() => toggle('instrument', instrument)}
                />
              ))}
            </Section>
          ) : null}

          {fields.includes('genre') ? (
            <Section title="Tarz">
              {GENRES.map((genre) => (
                <Chip
                  key={genre}
                  label={genre}
                  selected={draft.genre === genre}
                  onPress={() => toggle('genre', genre)}
                />
              ))}
            </Section>
          ) : null}
        </ScrollView>

        <View className="border-t border-border px-4 pt-4">
          <Pressable
            className="items-center rounded-lg bg-primary px-6 py-3 active:opacity-90"
            onPress={() => {
              onApply(draft)
              onClose()
            }}
          >
            <Text className="font-semibold text-text">Uygula</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      className={`rounded-full px-3 py-1.5 ${selected ? 'bg-primary' : 'bg-border'}`}
      onPress={onPress}
    >
      <Text className={`text-xs font-medium ${selected ? 'text-text' : 'text-text-secondary'}`}>
        {label}
      </Text>
    </Pressable>
  )
}
