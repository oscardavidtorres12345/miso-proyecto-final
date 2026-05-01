const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export const API_CONFIG = {
  IDENTITY_URL: env.EXPO_PUBLIC_IDENTITY_URL,
  SEARCH_URL: env.EXPO_PUBLIC_SEARCH_URL,
  ACCOMMODATION_URL: env.EXPO_PUBLIC_ACCOMMODATION_URL,
  BOOKING_URL: env.EXPO_PUBLIC_BOOKING_URL,
  WEB_APP_URL: env.EXPO_PUBLIC_WEB_APP_URL,
} as const;
