import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/api';
import { deselectConversation, getSocket, markMessageRead, selectConversation, sendMessage } from '@/lib/socket';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { EmojiKeyboard } from 'rn-emoji-keyboard';

interface Message {
    id: string;
    content: string;
    senderId: string;
    conversationId: string;
    createdAt: string;
    readAt: string | null;
}

// Demo messages for testing UI
const DEMO_MESSAGES: { [key: string]: Message[] } = {
    'demo-1': [
        {
            id: 'dm-1',
            content: 'Hey! Are you studying for the midterm?',
            senderId: 'user-1',
            conversationId: 'demo-1',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            readAt: new Date().toISOString(),
        },
        {
            id: 'dm-2',
            content: 'Ya, been at the library all day lol',
            senderId: 'current-user',
            conversationId: 'demo-1',
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            readAt: new Date().toISOString(),
        },
        {
            id: 'dm-3',
            content: 'Want to team up? I can bring snacks 😄',
            senderId: 'user-1',
            conversationId: 'demo-1',
            createdAt: new Date(Date.now() - 600000).toISOString(),
            readAt: null,
        },
    ],
    'demo-2': [
        {
            id: 'dm-4',
            content: 'Thanks for helping me with that problem set',
            senderId: 'user-2',
            conversationId: 'demo-2',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            readAt: new Date().toISOString(),
        },
        {
            id: 'dm-5',
            content: 'No problem! Let me know if you need help with anything else',
            senderId: 'current-user',
            conversationId: 'demo-2',
            createdAt: new Date(Date.now() - 82800000).toISOString(),
            readAt: new Date().toISOString(),
        },
    ],
    'demo-3': [
        {
            id: 'dm-6',
            content: 'Did you finish the homework?',
            senderId: 'user-3',
            conversationId: 'demo-3',
            createdAt: new Date(Date.now() - 604800000).toISOString(),
            readAt: null,
        },
        {
            id: 'dm-7',
            content: 'Almost done, should have it by tomorrow',
            senderId: 'current-user',
            conversationId: 'demo-3',
            createdAt: new Date(Date.now() - 601200000).toISOString(),
            readAt: new Date().toISOString(),
        },
        {
            id: 'dm-8',
            content: 'Cool, text me when it\'s ready',
            senderId: 'user-3',
            conversationId: 'demo-3',
            createdAt: new Date(Date.now() - 597600000).toISOString(),
            readAt: new Date().toISOString(),
        },
    ],
};

export default function ChatScreen() {
    const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
    const { token, userId } = useAuth();
    const isDemo = conversationId?.startsWith('demo-');

    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [socketConnected, setSocketConnected] = useState(true);
    const [sendError, setSendError] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    const loadMessages = useCallback(async () => {
        if (!conversationId) {
            setLoading(false);
            return;
        }

        // Handle demo conversations
        if (isDemo) {
            setMessages(DEMO_MESSAGES[conversationId] || []);
            setLoading(false);
            return;
        }

        if (!token || !userId) {
            setLoading(false);
            return;
        }

        try {
            const data = await apiRequest<{ messages: Message[] }>(
                `/conversations/${conversationId}/messages`,
                { method: 'GET' },
                token
            );
            setMessages(data.messages);

            // Mark messages as read
            const socket = getSocket();
            if (socket && data.messages.length > 0) {
                data.messages.forEach((msg) => {
                    if (msg.senderId !== userId && !msg.readAt) {
                        markMessageRead(conversationId, msg.id);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    }, [conversationId, token, userId, isDemo]);

    // Load messages on mount
    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    // Setup socket event listeners when screen is focused
    useFocusEffect(
        useCallback(() => {
            if (!conversationId) return;

            console.log(`[Chat] Screen focused: ${conversationId}`);
            selectConversation(conversationId);

            // Call PATCH endpoint to mark all messages as read (REST fallback) - skip for demo
            const markConversationAsRead = async () => {
                if (isDemo) return; // Don't call API for demo conversations
                try {
                    await apiRequest(
                        `/conversations/${conversationId}/read`,
                        { method: 'PATCH' },
                        token
                    );
                } catch (error) {
                    console.error('[Chat] Failed to mark conversation as read:', error);
                }
            };

            markConversationAsRead();

            const socket = getSocket();
            if (!socket) return;

            // Check initial socket connection status
            setSocketConnected(socket.connected);

            // Handler for receiving new messages
            const handleReceiveMessage = (message: Message) => {
                if (message.conversationId === conversationId) {
                    setMessages((prev) => [...prev, message]);
                    // Auto-mark as read when message arrives while screen is focused
                    if (message.senderId !== userId && !message.readAt) {
                        markMessageRead(conversationId, message.id);
                    }
                }
            };

            // Handler for read receipts
            const handleMessageRead = ({ messageId }: { messageId: string }) => {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === messageId ? { ...msg, readAt: new Date().toISOString() } : msg
                    )
                );
            };

            // Socket connection status handlers
            const handleConnect = () => {
                setSocketConnected(true);
                console.log('[Chat] Socket reconnected');
            };

            const handleDisconnect = () => {
                setSocketConnected(false);
                console.log('[Chat] Socket disconnected');
            };

            socket.on('receive_message', handleReceiveMessage);
            socket.on('message_read', handleMessageRead);
            socket.on('connect', handleConnect);
            socket.on('disconnect', handleDisconnect);

            // Cleanup when screen loses focus
            return () => {
                console.log(`[Chat] Screen unfocused: ${conversationId}`);
                socket.off('receive_message', handleReceiveMessage);
                socket.off('message_read', handleMessageRead);
                socket.off('connect', handleConnect);
                socket.off('disconnect', handleDisconnect);
                deselectConversation();
            };
        }, [conversationId, userId, token])
    );

    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        // Prevent sending in demo mode
        if (isDemo) {
            Alert.alert(
                'Demo Mode',
                'This is a demo conversation. Messages cannot be sent in demo mode. Connect to the backend to start real conversations.'
            );
            return;
        }

        if (!socketConnected) {
            setSendError('Reconnecting... try again in a moment');
            return;
        }

        const socket = getSocket();
        if (socket && socket.connected) {
            setSendError(null);
            sendMessage(conversationId, inputText);
            setInputText('');
            setEmojiOpen(false);
        } else {
            setSendError('Failed to send. Tap to retry');
        }
    };

    const handleEmojiSelect = (emoji: { emoji: string }) => {
        setInputText((prev) => prev + emoji.emoji);
        setEmojiOpen(false);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isOwn = item.senderId === userId;
        return (
            <View
                style={[
                    styles.messageContainer,
                    isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
                ]}
            >
                <View
                    style={[
                        styles.messageBubble,
                        isOwn ? styles.ownBubble : styles.otherBubble,
                    ]}
                >
                    <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>
                        {item.content}
                    </Text>
                    <Text style={[styles.timestamp, isOwn ? styles.ownTimestamp : styles.otherTimestamp]}>
                        {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                </View>
                {isOwn && (
                    <Text style={styles.readReceipt}>
                        {item.readAt ? '✓✓' : '✓'}
                    </Text>
                )}
            </View>
        );
    };

    // For demo conversations, we don't need authentication
    if (!conversationId || (!isDemo && (!token || !userId))) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Error: Missing conversation or authentication</Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={100}
        >
            {!socketConnected && (
                <View style={styles.reconnectingBanner}>
                    <Text style={styles.reconnectingText}>Reconnecting...</Text>
                </View>
            )}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                onContentSizeChange={() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
                    </View>
                }
            />

            {sendError && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{sendError}</Text>
                </View>
            )}

            <View style={styles.inputContainer}>
                <TouchableOpacity
                    style={styles.emojiButton}
                    onPress={() => setEmojiOpen(!emojiOpen)}
                >
                    <Text style={styles.emojiButtonText}>😊</Text>
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={200}
                />
                <TouchableOpacity
                    style={[styles.sendButton, (!inputText.trim() || !socketConnected) && styles.sendButtonDisabled]}
                    onPress={handleSendMessage}
                    disabled={!inputText.trim() || !socketConnected}
                >
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>

            {emojiOpen && (
                <EmojiKeyboard
                    onEmojiSelected={handleEmojiSelect}
                />
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    reconnectingBanner: {
        backgroundColor: '#FEF08A',
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#FCD34D',
    },
    reconnectingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400E',
    },
    errorContainer: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#FECACA',
    },
    errorText: {
        fontSize: 12,
        color: '#991B1B',
        fontWeight: '500',
    },
    errorBannerText: {
        fontSize: 13,
        color: '#DC2626',
        fontWeight: '600',
    },
    errorReceipt: {
        color: '#DC2626',
    },
    messageContainer: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    ownMessageContainer: {
        justifyContent: 'flex-end',
    },
    otherMessageContainer: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    ownBubble: {
        backgroundColor: '#007AFF',
    },
    otherBubble: {
        backgroundColor: '#e0e0e0',
    },
    messageText: {
        fontSize: 16,
    },
    ownText: {
        color: '#fff',
    },
    otherText: {
        color: '#000',
    },
    timestamp: {
        fontSize: 11,
        marginTop: 2,
    },
    ownTimestamp: {
        color: '#ccc',
    },
    otherTimestamp: {
        color: '#999',
    },
    readReceipt: {
        marginLeft: 4,
        fontSize: 12,
        color: '#007AFF',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    emojiButton: {
        padding: 8,
        marginRight: 8,
    },
    emojiButtonText: {
        fontSize: 24,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        maxHeight: 100,
    },
    sendButton: {
        marginLeft: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#007AFF',
        borderRadius: 20,
    },
    sendButtonDisabled: {
        backgroundColor: '#CCCCCC',
        opacity: 0.6,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
