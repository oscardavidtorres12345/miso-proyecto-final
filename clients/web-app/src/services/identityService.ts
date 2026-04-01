export interface RegisterPayload {
  first_name: string
  last_name: string
  email: string
  document_id: string
  document_type_id: number
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

export interface PrivacyNoticeResponse {
  iso_code: string
  jurisdiction_name: string
  applicable_regulation: string
  privacy_title: string
  privacy_content: string
  privacy_pdf_url: string[]
  privacy_version: string
  privacy_effective_at: string
  privacy_contact_email: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  status: string
  sprint: number
  hu_id: string
  message: string
  user: {
    user_id: number
    username: string
    email: string
    role: string
    is_active: boolean
  }
  permissions: string[]
  session_ttl_seconds: number
  session_expires_at: string
}

const BASE_URL = `${import.meta.env.VITE_IDENTITY_API_URL as string}/identity`
const HEADERS = { 'Content-Type': 'application/json' }

export async function getPrivacyNotice(isoCode: string): Promise<PrivacyNoticeResponse> {
  const response = await fetch(`${BASE_URL}/privacy/notices/${isoCode.toUpperCase()}`, {
    method: 'GET',
    headers: { ...HEADERS }
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error('Failed to fetch privacy notice')
  }
  return data as PrivacyNoticeResponse
}

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { ...HEADERS },
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

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${BASE_URL}/auth/web/login`, {
    method: 'POST',
    headers: { ...HEADERS },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : 'Login failed.'
    const error = new Error(detail) as Error & { status: number }
    error.status = response.status
    throw error
  }

  return data as LoginResponse
}
