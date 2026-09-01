import { Stack } from 'expo-router'
import { colors } from '@/lib/theme'

export default function KesfetLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.dark },
        animation: 'slide_from_right',
        animationDuration: 150,
      }}
    />
  )
}
