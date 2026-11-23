import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { useColors } from '@/providers/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function TabsLayout() {
  const c = useColors();
  const icon = (name: IconName) =>
    function TabIcon({ color, size }: { color: ColorValue; size: number }) {
      return <MaterialCommunityIcons name={name} color={color as string} size={size} />;
    };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: c.text,
        headerShadowVisible: false,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', headerTitle: 'Money Mint', tabBarIcon: icon('home-variant') }} />
      <Tabs.Screen name="transactions" options={{ title: 'Entries', tabBarIcon: icon('format-list-bulleted') }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports', tabBarIcon: icon('chart-donut') }} />
      <Tabs.Screen name="accounts" options={{ title: 'Accounts', tabBarIcon: icon('bank') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('dots-grid') }} />
    </Tabs>
  );
}
