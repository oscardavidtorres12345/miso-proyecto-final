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
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Invalid credentials');
  }

  return (await response.json()) as LoginResponse;
}
