import { Tabs } from 'expo-router'
import { Text } from 'react-native'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0A0A0A',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', height: 60, paddingBottom: 8 },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="jobs" options={{ title: 'Jobs', tabBarIcon: () => <Text>📦</Text> }} />
      <Tabs.Screen name="active" options={{ title: 'Active', tabBarIcon: () => <Text>🏍️</Text> }} />
      <Tabs.Screen name="earnings" options={{ title: 'Earnings', tabBarIcon: () => <Text>💰</Text> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: () => <Text>👤</Text> }} />
    </Tabs>
  )
}
