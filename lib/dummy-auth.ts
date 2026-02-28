import { useSyncExternalStore } from 'react';

import { apiRequest } from '@/lib/api';

export type QuizAnswers = Record<string, string>;

export type DummyUser = {
  id: string;
  fullName: string;
  email: string;
  quizCompleted: boolean;
  quizAnswers?: QuizAnswers | null;
  avatarBgColor: string;
  avatarTextColor: string;
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
  avatarBgColor: string;
  avatarTextColor: string;
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
    avatarBgColor: string;
    avatarTextColor: string;
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

export function getAuthToken() {
  return store.token;
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
    return { ok: true, user: data.user };
  } catch (error) {
    store.token = null;
    store.user = null;
    notify();
    return { ok: false, error: normalizeError(error) };
  }
}

export function logoutDummyUser() {
  store.token = null;
  store.user = null;
  notify();
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

declare global {
  var __authStore: AuthState | undefined;
}
