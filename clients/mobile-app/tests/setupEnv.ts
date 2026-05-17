const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;

if (env) {
  // Prevent RTL from registering automatic global cleanup which can await async teardown
  // and cause hook timeouts in concurrent CI environments.
  env.RNTL_SKIP_AUTO_CLEANUP = env.RNTL_SKIP_AUTO_CLEANUP ?? 'true';

  const keyIdentity = 'EXPO_PUBLIC_IDENTITY_URL';
  const keySearch = 'EXPO_PUBLIC_SEARCH_URL';
  const keyAccommodation = 'EXPO_PUBLIC_ACCOMMODATION_URL';
  const keyBooking = 'EXPO_PUBLIC_BOOKING_URL';
  const keyWebApp = 'EXPO_PUBLIC_WEB_APP_URL';

  env[keyIdentity] = env[keyIdentity] ?? 'http://localhost:8001/api/v1';
  env[keySearch] = env[keySearch] ?? 'http://localhost:3001/api/v1';
  env[keyAccommodation] = env[keyAccommodation] ?? 'http://localhost:8002/api/v1';
  env[keyBooking] = env[keyBooking] ?? 'http://localhost:8004/api/v1';
  env[keyWebApp] = env[keyWebApp] ?? 'http://localhost:5173';
}
