import { API_CONFIG } from '../config/api';
import type { LoginPayload, LoginResponse, RegisterPayload, RegisterResponse } from '../types/api';

const BASE_URL = API_CONFIG.IDENTITY_URL;

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to register user');
  }

  return (await response.json()) as RegisterResponse;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${BASE_URL}/identity/auth/web/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as { detail: string | Array<{ msg: string }> } & LoginResponse;

  if (!response.ok) {
    let detail = '';

    if (Array.isArray(data.detail as Array<{ msg: string }>)) detail = (data.detail as Array<{ msg: string }>).map(({ msg }) => msg).join(', ');
    else if (typeof data.detail === 'string') detail = data.detail;
    else detail = 'Login failed';

    const error = new Error(detail);
    (error as any).status = response.status;
    throw error;
  }

  return data;
}
