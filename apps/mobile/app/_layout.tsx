import 'react-native-url-polyfill/auto'
import '../global.css'

import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@stagein/supabase'
import { useAuthStore } from '@/stores/authStore'
import { colors } from '@/lib/theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
})

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void initialize().finally(() => setReady(true))
  }, [initialize])

  // Uygulama önplandayken token yenileme açık kalsın
  useEffect(() => {
    supabase.auth.startAutoRefresh()
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh()
      else supabase.auth.stopAutoRefresh()
    })
    return () => subscription.remove()
  }, [])

  if (!ready) return null

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.dark }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" backgroundColor={colors.dark} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.dark },
              animation: 'fade',
              animationDuration: 150,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
