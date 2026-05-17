const env = typeof process !== 'undefined' ? process.env : {};

export const API_CONFIG = __DEV__ ? {
  IDENTITY_URL: env.EXPO_PUBLIC_IDENTITY_URL || 'http://localhost:8001/api/v1',
  SEARCH_URL: env.EXPO_PUBLIC_SEARCH_URL || 'http://localhost:3001/api/v1',
  ACCOMMODATION_URL: env.EXPO_PUBLIC_ACCOMMODATION_URL || 'http://localhost:8002/api/v1',
  BOOKING_URL: env.EXPO_PUBLIC_BOOKING_URL || 'http://localhost:8004/api/v1',
  WEB_APP_URL: env.EXPO_PUBLIC_WEB_APP_URL || 'http://localhost:5173',
} : {
  IDENTITY_URL: 'https://d3sxrxy8icsofs.cloudfront.net/api/v1',
  SEARCH_URL: 'https://d3sxrxy8icsofs.cloudfront.net/api/v1',
  ACCOMMODATION_URL: 'https://d3sxrxy8icsofs.cloudfront.net/api/v1',
  BOOKING_URL: 'https://d3sxrxy8icsofs.cloudfront.net/api/v1',
  WEB_APP_URL: 'https://d3sxrxy8icsofs.cloudfront.net',
} as const;
