export interface RegisterPayload {
  first_name: string
  last_name: string
  email: string
  document_id: string
  id_type: number
  jurisdiction_id: number
  password: string
  password_confirmation: string
  role?: string
}

export interface RegisterResponse {
  status: string
  sprint: number
  hu_id: string
  user_id: number
  guest_id: number | null
  username: string
  email: string
  role: string
  jurisdiction_id: number
  message: string
}

const BASE_URL = import.meta.env.VITE_IDENTITY_API_URL as string

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : 'Registration failed.'
    const error = new Error(detail) as Error & { status: number }
    error.status = response.status
    throw error
  }

  return data as RegisterResponse
}
