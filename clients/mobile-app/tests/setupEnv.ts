const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;

if (env) {
  const keyIdentity = 'EXPO_PUBLIC_IDENTITY_URL';
  const keySearch = 'EXPO_PUBLIC_SEARCH_URL';
  const keyAccommodation = 'EXPO_PUBLIC_ACCOMMODATION_URL';
  const keyBooking = 'EXPO_PUBLIC_BOOKING_URL';

  env[keyIdentity] = env[keyIdentity] ?? 'http://localhost:8001/api/v1';
  env[keySearch] = env[keySearch] ?? 'http://localhost:8002/api/v1';
  env[keyAccommodation] = env[keyAccommodation] ?? 'http://localhost:8002/api/v1';
  env[keyBooking] = env[keyBooking] ?? 'http://localhost:8004/api/v1';
}
