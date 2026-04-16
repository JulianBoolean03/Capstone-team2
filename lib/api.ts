import { Platform } from 'react-native';
import Constants from 'expo-constants';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function hostFromUri(hostUri?: string | null) {
  if (!hostUri) return null;
  const host = hostUri.split(':')[0]?.trim();
  return host ? `http://${host}:4000` : null;
}

function resolveCandidateBaseUrls() {
  const explicit = process.env.EXPO_PUBLIC_API_URL?.trim() || null;
  const expoConfigHost = hostFromUri(Constants.expoConfig?.hostUri);

  const constantsAny = Constants as unknown as {
    expoGoConfig?: { debuggerHost?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
  };
  const expoGoHost = hostFromUri(constantsAny.expoGoConfig?.debuggerHost);
  const manifestHost = hostFromUri(constantsAny.manifest2?.extra?.expoClient?.hostUri);
  const emulatorFallback = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : null;
  const localhostFallback = 'http://localhost:4000';

  const seen = new Set<string>();
  const candidates = [
    explicit,
    expoConfigHost,
    expoGoHost,
    manifestHost,
    emulatorFallback,
    localhostFallback,
  ].filter((value): value is string => !!value);

  return candidates.filter((url) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

const API_BASE_URL_CANDIDATES = resolveCandidateBaseUrls();

type RequestInitWithJson = RequestInit & {
  json?: unknown;
};

export async function apiRequest<T>(
  path: string,
  options: RequestInitWithJson = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let lastNetworkError = false;

  for (const baseUrl of API_BASE_URL_CANDIDATES) {
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
        body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
      });
    } catch {
      lastNetworkError = true;
      continue;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(data.error || 'Request failed.', response.status);
    }

    return data as T;
  }

  if (lastNetworkError) {
    throw new Error(
      `Cannot reach API. Tried: ${API_BASE_URL_CANDIDATES.join(', ')}. Start backend with: npm run api`,
    );
  }

  throw new Error('Request failed.');
}

export function getApiBaseUrl() {
  return API_BASE_URL_CANDIDATES[0] ?? 'http://localhost:4000';
}
