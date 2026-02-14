import { useSyncExternalStore } from 'react';

export type QuizAnswers = Record<string, string>;

export type DummyUser = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  quizCompleted: boolean;
  quizAnswers?: QuizAnswers;
};

type AuthState = {
  users: DummyUser[];
  sessionUserId: string | null;
};

type AuthResult = {
  ok: boolean;
  error?: string;
  user?: DummyUser;
};

const initialState: AuthState = {
  users: [
    {
      id: 'demo-1',
      fullName: 'Demo Student',
      email: 'student@university.edu',
      password: 'password123',
      quizCompleted: false,
    },
  ],
  sessionUserId: null,
};

const store: AuthState = globalThis.__dummyAuthStore ?? {
  users: [...initialState.users],
  sessionUserId: initialState.sessionUserId,
};
globalThis.__dummyAuthStore = store;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function subscribeAuth(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDummyAuth() {
  return useSyncExternalStore(subscribeAuth, getCurrentUser, getCurrentUser);
}

export function getCurrentUser() {
  if (!store.sessionUserId) {
    return null;
  }

  return store.users.find((user) => user.id === store.sessionUserId) ?? null;
}

export function signUpDummyUser(input: {
  fullName: string;
  email: string;
  password: string;
}): AuthResult {
  const fullName = input.fullName.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!fullName || !email || !password) {
    return { ok: false, error: 'Please fill in all required fields.' };
  }

  const alreadyExists = store.users.some((user) => normalizeEmail(user.email) === email);
  if (alreadyExists) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  const user: DummyUser = {
    id: `user-${Date.now()}`,
    fullName,
    email,
    password,
    quizCompleted: false,
  };

  store.users.push(user);
  store.sessionUserId = user.id;
  notify();

  return { ok: true, user };
}

export function loginDummyUser(input: { email: string; password: string }): AuthResult {
  const email = normalizeEmail(input.email);
  const password = input.password;

  const user = store.users.find(
    (candidate) => normalizeEmail(candidate.email) === email && candidate.password === password,
  );

  if (!user) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  store.sessionUserId = user.id;
  notify();

  return { ok: true, user };
}

export function logoutDummyUser() {
  store.sessionUserId = null;
  notify();
}

export function completeCurrentUserQuiz(answers: QuizAnswers): AuthResult {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { ok: false, error: 'No logged-in user found.' };
  }

  currentUser.quizCompleted = true;
  currentUser.quizAnswers = answers;
  notify();

  return { ok: true, user: currentUser };
}

declare global {
  var __dummyAuthStore: AuthState | undefined;
}
