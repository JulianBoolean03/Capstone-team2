import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiRequest, ApiError } from '@/lib/api';

const STORAGE_KEY_TOKEN = 'studyapp_auth_token';
const STORAGE_KEY_USER = 'studyapp_auth_user';

export type QuizAnswers = Record<string, string>;

export type DummyUser = {
  id: string;
  fullName: string;
  email: string;
  quizCompleted: boolean;
  quizAnswers?: QuizAnswers | null;
  createdAt?: string;
};

type AuthState = {
  user: DummyUser | null;
  token: string | null;
};

type AuthResult = {
  ok: boolean;
  error?: string;
  user?: DummyUser;
};

export type RecommendationCard = {
  id: string;
  fullName: string;
  email: string;
  matchPct: number;
  relation: 'none' | 'request_sent' | 'request_received' | 'friends';
  requestId: string | null;
};

export type FriendRequestsPayload = {
  incoming: Array<{
    id: string;
    sender: DummyUser;
    createdAt: string;
  }>;
  outgoing: Array<{
    id: string;
    receiver: DummyUser;
    createdAt: string;
  }>;
  friends: Array<{
    id: string;
    fullName: string;
    email: string;
    connectedAt: string;
  }>;
};

const store: AuthState = globalThis.__authStore ?? {
  user: null,
  token: null,
};
globalThis.__authStore = store;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function normalizeError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Something went wrong.';
}

async function persistAuth() {
  try {
    if (store.token && store.user) {
      await AsyncStorage.setItem(STORAGE_KEY_TOKEN, store.token);
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(store.user));
    } else {
      await AsyncStorage.multiRemove([STORAGE_KEY_TOKEN, STORAGE_KEY_USER]);
    }
  } catch {
    // Storage write failed — non-critical, session just won't survive restart
  }
}

export async function rehydrateAuth(): Promise<boolean> {
  try {
    const [token, userJson] = await AsyncStorage.multiGet([STORAGE_KEY_TOKEN, STORAGE_KEY_USER]);
    const savedToken = token[1];
    const savedUser = userJson[1];

    if (savedToken && savedUser) {
      store.token = savedToken;
      store.user = JSON.parse(savedUser);
      notify();
      return true;
    }
  } catch {
    // Corrupted storage — start fresh
  }
  return false;
}

export function subscribeAuth(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDummyAuth() {
  return useSyncExternalStore(subscribeAuth, getCurrentUser, getCurrentUser);
}

export function getCurrentUser() {
  return store.user;
}

export function hasAuthToken() {
  return !!store.token;
}

export async function signUpDummyUser(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    const data = await apiRequest<{ token: string; user: DummyUser }>('/auth/signup', {
      method: 'POST',
      json: input,
    });

    store.token = data.token;
    store.user = data.user;
    notify();
    await persistAuth();

    return { ok: true, user: data.user };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
}

export async function loginDummyUser(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    const data = await apiRequest<{ token: string; user: DummyUser }>('/auth/login', {
      method: 'POST',
      json: input,
    });

    store.token = data.token;
    store.user = data.user;
    notify();
    await persistAuth();

    return { ok: true, user: data.user };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
}

export async function refreshCurrentUser(): Promise<AuthResult> {
  if (!store.token) {
    store.user = null;
    notify();
    return { ok: false, error: 'Not authenticated.' };
  }

  try {
    const data = await apiRequest<{ user: DummyUser }>('/auth/me', { method: 'GET' }, store.token);
    store.user = data.user;
    notify();
    await persistAuth();
    return { ok: true, user: data.user };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      store.token = null;
      store.user = null;
      notify();
      await persistAuth();
    }
    return { ok: false, error: normalizeError(error) };
  }
}

export async function logoutDummyUser() {
  store.token = null;
  store.user = null;
  notify();
  await persistAuth();
}

export async function completeCurrentUserQuiz(answers: QuizAnswers): Promise<AuthResult> {
  if (!store.token) {
    return { ok: false, error: 'Not authenticated.' };
  }

  try {
    const data = await apiRequest<{ user: DummyUser }>(
      '/quiz/submit',
      {
        method: 'POST',
        json: { answers },
      },
      store.token,
    );

    store.user = data.user;
    notify();
    await persistAuth();

    return { ok: true, user: data.user };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
}

export async function fetchRecommendations() {
  if (!store.token) {
    return [] as RecommendationCard[];
  }

  const data = await apiRequest<{ students: RecommendationCard[] }>(
    '/discover',
    { method: 'GET' },
    store.token,
  );

  return data.students;
}

export async function sendFriendRequest(receiverId: string) {
  if (!store.token) {
    throw new Error('Not authenticated.');
  }

  await apiRequest(
    '/friends/request',
    {
      method: 'POST',
      json: { receiverId },
    },
    store.token,
  );
}

export async function fetchFriendRequests() {
  if (!store.token) {
    return {
      incoming: [],
      outgoing: [],
      friends: [],
    } as FriendRequestsPayload;
  }

  return apiRequest<FriendRequestsPayload>('/friends/requests', { method: 'GET' }, store.token);
}

export async function respondToFriendRequest(requestId: string, action: 'accept' | 'decline') {
  if (!store.token) {
    throw new Error('Not authenticated.');
  }

  await apiRequest(
    `/friends/request/${requestId}/respond`,
    {
      method: 'POST',
      json: { action },
    },
    store.token,
  );
}

export type Conversation = {
  id: string;
  otherMembers: { id: string; fullName: string; email: string }[];
  lastMessage: { text: string; createdAt: string; senderId: string } | null;
  createdAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender: { id: string; fullName: string };
};

export async function fetchConversations(): Promise<Conversation[]> {
  if (!store.token) return [];
  const data = await apiRequest<{ conversations: Conversation[] }>(
    '/conversations',
    { method: 'GET' },
    store.token,
  );
  return data.conversations;
}

export async function createConversation(otherUserId: string): Promise<string> {
  if (!store.token) throw new Error('Not authenticated.');
  const data = await apiRequest<{ conversationId: string }>(
    '/conversations',
    { method: 'POST', json: { otherUserId } },
    store.token,
  );
  return data.conversationId;
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  if (!store.token) return [];
  const data = await apiRequest<{ messages: Message[] }>(
    `/conversations/${conversationId}/messages`,
    { method: 'GET' },
    store.token,
  );
  return data.messages;
}

export async function sendMessage(conversationId: string, text: string): Promise<Message> {
  if (!store.token) throw new Error('Not authenticated.');
  const data = await apiRequest<{ message: Message }>(
    `/conversations/${conversationId}/messages`,
    { method: 'POST', json: { text } },
    store.token,
  );
  return data.message;
}

declare global {
  var __authStore: AuthState | undefined;
}
