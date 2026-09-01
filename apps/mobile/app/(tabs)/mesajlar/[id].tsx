import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import { router, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { MAX_AUDIO_NOTE_SECONDS } from '@stagein/shared'
import type { ContextType } from '@stagein/shared'
import { MessageBubble } from '@/components/MessageBubble'
import { UserAvatar } from '@/components/UserAvatar'
import { fetchConversation, fetchListing, fetchUser, uploadAudioNote } from '@/lib/api'
import { formatDuration } from '@/lib/format'
import { colors } from '@/lib/theme'
import { useMessages } from '@/hooks/useMessages'
import { useAuthStore } from '@/stores/authStore'

export default function SohbetScreen() {
  const { id, contextType, contextId } = useLocalSearchParams<{
    id: string
    contextType?: ContextType
    contextId?: string
  }>()
  const insets = useSafeAreaInsets()
  const userId = useAuthStore((s) => s.session?.user.id ?? null)
  const listRef = useRef<FlatList>(null)

  const [draft, setDraft] = useState('')
  const [recordingSeconds, setRecordingSeconds] = useState<number | null>(null)
  const [sendingAudio, setSendingAudio] = useState(false)
  const recordingRef = useRef<Audio.Recording | null>(null)

  const { messages, isLoading, send } = useMessages(id, userId)

  const { data: conversation } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => fetchConversation(id),
    enabled: Boolean(id),
  })

  const otherUserId = useMemo(
    () => conversation?.participant_ids.find((participant) => participant !== userId) ?? null,
    [conversation, userId]
  )

  const { data: other } = useQuery({
    queryKey: ['user', otherUserId],
    queryFn: () => fetchUser(otherUserId!),
    enabled: Boolean(otherUserId),
  })

  // Sohbetin bağlamı: parametreyle geldiyse onu, yoksa ilk mesajdan çıkar
  const context = useMemo(() => {
    if (contextType && contextType !== 'direct' && contextId) {
      return { type: contextType, id: contextId }
    }
    const first = messages.find((m) => m.context_type !== 'direct' && m.context_id)
    return first ? { type: first.context_type, id: first.context_id! } : null
  }, [contextType, contextId, messages])

  const { data: contextListing } = useQuery({
    queryKey: ['listing', context?.id],
    queryFn: () => fetchListing(context!.id),
    enabled: context?.type === 'listing' && Boolean(context?.id),
  })

  useEffect(() => {
    if (messages.length > 0) listRef.current?.scrollToEnd({ animated: true })
  }, [messages.length])

  // 60 sn dolduğunda kaydı kendiliğinden bitir
  useEffect(() => {
    if (recordingSeconds === null) return
    if (recordingSeconds >= MAX_AUDIO_NOTE_SECONDS) {
      void stopRecording()
      return
    }
    const timer = setTimeout(() => setRecordingSeconds((value) => (value ?? 0) + 1), 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingSeconds])

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync()
      if (!permission.granted) return
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      recordingRef.current = recording
      setRecordingSeconds(0)
    } catch (error) {
      console.warn('[StageIn] kayıt başlatılamadı', error)
      setRecordingSeconds(null)
    }
  }

  async function stopRecording() {
    const recording = recordingRef.current
    recordingRef.current = null
    const seconds = recordingSeconds ?? 0
    setRecordingSeconds(null)
    if (!recording || !userId) return

    try {
      await recording.stopAndUnloadAsync()
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false })
      const uri = recording.getURI()
      // Kazara dokunuşları sesli not olarak göndermeyelim
      if (!uri || seconds < 1) return
      setSendingAudio(true)
      const audioUrl = await uploadAudioNote(userId, uri)
      await send.mutateAsync({
        audioUrl,
        contextType: context?.type ?? 'direct',
        contextId: context?.id ?? null,
      })
    } catch (error) {
      console.warn('[StageIn] sesli not gönderilemedi', error)
    } finally {
      setSendingAudio(false)
    }
  }

  function sendText() {
    const content = draft.trim()
    if (!content) return
    setDraft('')
    send.mutate({ content, contextType: context?.type ?? 'direct', contextId: context?.id ?? null })
  }

  const isRecording = recordingSeconds !== null

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View
        className="flex-row items-center gap-3 border-b border-border px-4 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable className="h-10 w-10 justify-center" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <UserAvatar url={other?.avatar_url} name={other?.username} size={36} />
        <View className="flex-1">
          <Text className="font-bold text-text" numberOfLines={1}>
            {other?.full_name || other?.username || 'Müzisyen'}
          </Text>
          {other?.city ? <Text className="text-xs text-muted">{other.city}</Text> : null}
        </View>
      </View>

      {context ? (
        <Pressable
          className="flex-row items-center gap-2 border-b border-border bg-card px-4 py-3"
          disabled={context.type !== 'listing'}
          onPress={() =>
            router.push({ pathname: '/(tabs)/ilanlar/[id]', params: { id: context.id } })
          }
        >
          <Ionicons
            name={context.type === 'video' ? 'play-circle-outline' : 'list-outline'}
            size={16}
            color={colors.primary}
          />
          <Text className="flex-1 text-xs text-text-secondary" numberOfLines={1}>
            {context.type === 'video'
              ? 'Bir video üzerinden başladı'
              : (contextListing?.title ?? 'Bir ilan üzerinden başladı')}
          </Text>
          {context.type === 'listing' ? (
            <Ionicons name="chevron-forward" size={14} color={colors.muted} />
          ) : null}
        </Pressable>
      ) : null}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1, justifyContent: 'flex-end' }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-center text-sm text-muted">
                Selam ver, birlikte çalmaya buradan başlanır.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <MessageBubble message={item} isOwn={item.sender_id === userId} />
          )}
        />
      )}

      <View
        className="flex-row items-end gap-2 border-t border-border px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        {isRecording ? (
          <View className="h-12 flex-1 flex-row items-center gap-3 rounded-lg border border-accent bg-card px-4">
            <View className="h-2 w-2 rounded-full bg-accent" />
            <Text className="text-sm text-text">Kaydediliyor {formatDuration(recordingSeconds)}</Text>
            <Text className="ml-auto text-xs text-muted">
              {MAX_AUDIO_NOTE_SECONDS - recordingSeconds} sn
            </Text>
          </View>
        ) : (
          <TextInput
            className="max-h-28 min-h-[48px] flex-1 rounded-lg border border-border bg-card px-4 py-3 text-white"
            placeholder="Mesaj yaz..."
            placeholderTextColor={colors.muted}
            multiline
            value={draft}
            onChangeText={setDraft}
          />
        )}

        {draft.trim().length > 0 ? (
          <Pressable
            className="h-12 w-12 items-center justify-center rounded-lg bg-primary active:opacity-90"
            onPress={sendText}
          >
            <Ionicons name="send" size={18} color={colors.text} />
          </Pressable>
        ) : (
          <Pressable
            className={`h-12 w-12 items-center justify-center rounded-lg ${
              isRecording ? 'bg-accent' : 'bg-card border border-border'
            }`}
            disabled={sendingAudio}
            onPressIn={startRecording}
            onPressOut={stopRecording}
          >
            {sendingAudio ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Ionicons name="mic" size={20} color={isRecording ? colors.text : colors.muted} />
            )}
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}
