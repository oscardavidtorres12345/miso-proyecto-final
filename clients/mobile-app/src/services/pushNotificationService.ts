import { API_CONFIG } from '../config/api';

const BASE_URL = API_CONFIG.BOOKING_URL;

export async function registerPushToken(
  userId: string,
  expoPushToken: string,
  platform: string,
): Promise<{ status: string; token_id?: number }> {
  const response = await fetch(`${BASE_URL}/bookings/mobile/push-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      expo_push_token: expoPushToken,
      platform,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to register push token: ${response.status}`);
  }

  return (await response.json()) as { status: string; token_id?: number };
}
