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
import { Link, router } from 'expo-router'
import { signUpWithEmail } from '@stagein/supabase'
import { authErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/stores/authStore'
import { colors } from '@/lib/theme'

export default function KayitScreen() {
  const insets = useSafeAreaInsets()
  const refreshProfile = useAuthStore((s) => s.refreshProfile)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const canSubmit = email.includes('@') && password.length >= 6 && !pending

  async function submit() {
    setError(null)
    setPending(true)
    try {
      const result = await signUpWithEmail(email.trim(), password)
      if (!result.session) {
        // E-posta doğrulaması açıksa oturum hemen gelmez
        setConfirmationSent(true)
        return
      }
      await refreshProfile()
      router.replace('/(auth)/onboarding')
    } catch (err) {
      setError(authErrorMessage(err, 'Kayıt tamamlanamadı'))
    } finally {
      setPending(false)
    }
  }

  if (confirmationSent) {
    return (
      <View className="flex-1 items-center justify-center bg-dark px-6">
        <Ionicons name="mail-outline" size={40} color={colors.primary} />
        <Text className="mt-6 text-center text-3xl font-black text-text">E-postanı doğrula</Text>
        <Text className="mt-3 text-center text-base text-text-secondary">
          {email} adresine bir doğrulama bağlantısı gönderdik. Doğruladıktan sonra giriş yapabilirsin.
        </Text>
        <Pressable
          className="mt-8 rounded-lg bg-primary px-6 py-3 active:opacity-90"
          onPress={() => router.replace('/(auth)/giris')}
        >
          <Text className="font-semibold text-text">Giriş ekranına dön</Text>
        </Pressable>
      </View>
    )
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

        <Text className="text-5xl font-black text-text">Kayıt ol</Text>
        <Text className="mt-2 text-base text-text-secondary">
          Çal, paylaş, doğru insanlarla tanış.
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
            placeholder="Şifre (en az 6 karakter)"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {error ? <Text className="mt-4 text-sm text-accent">{error}</Text> : null}

        <Pressable
          className="mt-6 flex-row items-center justify-center rounded-lg bg-primary px-6 py-3 active:opacity-90"
          disabled={!canSubmit}
          style={{ opacity: canSubmit ? 1 : 0.5 }}
          onPress={submit}
        >
          {pending ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text className="font-semibold text-text">Hesap Oluştur</Text>
          )}
        </Pressable>

        <View className="mt-auto flex-row justify-center gap-1 pt-10">
          <Text className="text-sm text-muted">Zaten üye misin?</Text>
          <Link href="/(auth)/giris" className="text-sm font-semibold text-primary">
            Giriş yap
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
