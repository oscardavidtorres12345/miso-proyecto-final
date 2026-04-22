export interface RoomRateDto {
  room_id: number
  property_id: number
  room_type: string
  base_rate: number
  offer_rate: number | null
  offer_active: boolean
  effective_rate: number
  currency: string
  occupied_units: number
  total_units: number
  availability: string
  offer_status: string
  updated_at: string
}

export interface RoomRatesDto {
  rates: RoomRateDto[]
}

function resolveBaseUrl(): string {
  const base = import.meta.env.VITE_INVENTORY_API_URL as string | undefined
  if (typeof base !== 'string' || !base.trim()) {
    throw new Error('VITE_INVENTORY_API_URL is not defined. Set it in .env.')
  }
  return base.replace(/\/$/, '')
}

function formatErrorDetail(data: unknown): string {
  if (data && typeof data === 'object' && 'detail' in data) {
    const d = (data as { detail: unknown }).detail
    if (typeof d === 'string') return d
    if (
      Array.isArray(d) &&
      d.length > 0 &&
      typeof d[0] === 'object' &&
      d[0] !== null &&
      'msg' in d[0]
    ) {
      return String((d[0] as { msg: unknown }).msg)
    }
  }
  return 'Request failed.'
}

export async function getRates(token: string, currency?: string): Promise<RoomRateDto[]> {
  const baseUrl = resolveBaseUrl()
  const params = new URLSearchParams()
  if (currency) params.set('currency', currency)
  const query = params.toString() ? `?${params.toString()}` : ''

  const response = await fetch(`${baseUrl}/inventory/rates${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data: unknown = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = formatErrorDetail(data)
    const error = new Error(message) as Error & { status: number }
    error.status = response.status
    throw error
  }

  return (data as RoomRatesDto).rates
}
