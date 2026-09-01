import { Ionicons } from '@expo/vector-icons'
import { router, Tabs } from 'expo-router'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '@/stores/authStore'
import { colors, TAB_BAR_HEIGHT } from '@/lib/theme'

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  const isGuest = useAuthStore((s) => s.status !== 'authenticated')

  /** Misafir kullanıcı yalnızca Keşfet ve İlanlar'ı görebilir */
  const guestGuard = {
    tabPress: (event: { preventDefault: () => void }) => {
      if (!isGuest) return
      event.preventDefault()
      router.push('/(auth)/giris')
    },
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        sceneStyle: { backgroundColor: colors.dark },
      }}
    >
      <Tabs.Screen
        name="kesfet"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color, size }) => <Ionicons name="play-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ilanlar"
        options={{
          title: 'İlanlar',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="yukle"
        options={{ title: '', tabBarButton: (props) => <UploadButton {...props} /> }}
        listeners={guestGuard}
      />
      <Tabs.Screen
        name="mesajlar"
        options={{
          title: 'Mesajlar',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble" size={size} color={color} />,
        }}
        listeners={guestGuard}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
        listeners={guestGuard}
      />
    </Tabs>
  )
}

/** Ortadaki büyük yükleme butonu */
function UploadButton({ onPress }: { onPress?: (event: any) => void }) {
  return (
    <View className="flex-1 items-center justify-center">
      <Pressable
        className="h-12 w-12 items-center justify-center rounded-full bg-primary active:opacity-90"
        onPress={onPress}
      >
        <Ionicons name="add" size={28} color={colors.text} />
      </Pressable>
    </View>
  )
}
