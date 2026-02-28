import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs, useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDummyAuth } from '@/lib/dummy-auth';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const currentUser = useDummyAuth();
  const router = useRouter();

  if (!currentUser) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!currentUser.quizCompleted) {
    return <Redirect href="/(auth)/quiz" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="message.fill" color={color} />,
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16, paddingHorizontal: 8 }}
              onPress={() => router.push('/chat/new')}
            >
              <Ionicons name="add-circle" size={28} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
