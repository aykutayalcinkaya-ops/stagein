import { Redirect } from 'expo-router'
import { ActivityIndicator, Text, View } from 'react-native'
import { useAuthStore } from '@/stores/authStore'
import { colors } from '@/lib/theme'

/** Splash + yönlendirici. Misafir de akışı görebilir. */
export default function Index() {
  const status = useAuthStore((s) => s.status)
  const needsOnboarding = useAuthStore((s) => s.needsOnboarding)

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-dark">
        <Text className="text-5xl font-black tracking-tight text-text">StageIn</Text>
        <ActivityIndicator className="mt-8" color={colors.primary} />
      </View>
    )
  }

  if (status === 'authenticated' && needsOnboarding) {
    return <Redirect href="/(auth)/onboarding" />
  }

  return <Redirect href="/(tabs)/kesfet" />
}
