import { useEffect, useState } from 'react'
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
import * as AppleAuthentication from 'expo-apple-authentication'
import { Ionicons } from '@expo/vector-icons'
import { Link, router } from 'expo-router'
import { signInWithEmail } from '@stagein/supabase'
import { authErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/stores/authStore'
import { signInWithApple, signInWithGoogleNative } from '@/lib/oauth'
import { colors } from '@/lib/theme'

export default function GirisScreen() {
  const insets = useSafeAreaInsets()
  const refreshProfile = useAuthStore((s) => s.refreshProfile)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState<null | 'email' | 'google' | 'apple'>(null)
  const [error, setError] = useState<string | null>(null)
  const [appleAvailable, setAppleAvailable] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'ios') return
    void AppleAuthentication.isAvailableAsync().then(setAppleAvailable)
  }, [])

  async function run(kind: 'email' | 'google' | 'apple', action: () => Promise<unknown>) {
    setError(null)
    setPending(kind)
    try {
      await action()
      await refreshProfile()
      router.replace('/')
    } catch (err) {
      setError(authErrorMessage(err, 'Giriş yapılamadı'))
    } finally {
      setPending(null)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
        className="px-6"
        keyboardShouldPersistTaps="handled"
      >
        <Pressable className="mb-8 h-10 w-10 justify-center" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <Text className="text-5xl font-black text-text">Giriş yap</Text>
        <Text className="mt-2 text-base text-text-secondary">
          Sahneye kaldığın yerden devam et.
        </Text>

        <View className="mt-10 gap-3">
          <TextInput
            className="rounded-lg border border-border bg-card px-4 py-3 text-white"
            placeholder="E-posta"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            className="rounded-lg border border-border bg-card px-4 py-3 text-white"
            placeholder="Şifre"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {error ? <Text className="mt-4 text-sm text-accent">{error}</Text> : null}

        <Pressable
          className="mt-6 flex-row items-center justify-center rounded-lg bg-primary px-6 py-3 active:opacity-90"
          disabled={pending !== null || !email || !password}
          style={{ opacity: pending !== null || !email || !password ? 0.5 : 1 }}
          onPress={() => run('email', () => signInWithEmail(email.trim(), password))}
        >
          {pending === 'email' ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text className="font-semibold text-text">Giriş Yap</Text>
          )}
        </Pressable>

        <View className="my-8 flex-row items-center gap-3">
          <View className="h-px flex-1 bg-border" />
          <Text className="text-xs uppercase tracking-wide text-muted">veya</Text>
          <View className="h-px flex-1 bg-border" />
        </View>

        <Pressable
          className="flex-row items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-3 active:opacity-90"
          disabled={pending !== null}
          onPress={() => run('google', signInWithGoogleNative)}
        >
          {pending === 'google' ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color={colors.text} />
              <Text className="font-semibold text-text">Google ile devam et</Text>
            </>
          )}
        </Pressable>

        {appleAvailable ? (
          <Pressable
            className="mt-3 flex-row items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-3 active:opacity-90"
            disabled={pending !== null}
            onPress={() => run('apple', signInWithApple)}
          >
            {pending === 'apple' ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Ionicons name="logo-apple" size={18} color={colors.text} />
                <Text className="font-semibold text-text">Apple ile devam et</Text>
              </>
            )}
          </Pressable>
        ) : null}

        <View className="mt-auto flex-row justify-center gap-1 pt-10">
          <Text className="text-sm text-muted">Hesabın yok mu?</Text>
          <Link href="/(auth)/kayit" className="text-sm font-semibold text-primary">
            Kayıt ol
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
