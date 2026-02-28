import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

export default function ChatLayout() {
    const router = useRouter();

    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Messages',
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
            <Stack.Screen
                name="new"
                options={{
                    presentation: 'modal',
                    title: 'New Chat',
                    headerBackTitleVisible: false,
                }}
            />
            <Stack.Screen name="[conversationId]" options={{ title: 'Chat' }} />
        </Stack>
    );
}
