export interface HotelPhoto {
  url: string
  alt: string | null
}

export interface HotelAmenity {
  id: string
}

export interface HotelSchedule {
  checkIn: {
    from: string
    to: string
  }
  checkOut: {
    time: string
  }
}

export interface RoomPrice {
  totalAmount: number
  pricePerNight: number
  currency: string
  nights: number
  adults: number
  includesTaxes: boolean
}

export interface HotelRoom {
  id: number
  name: string
  description: string
  images: string[]
  price: RoomPrice
}

export interface HotelSuggestedRoom {
  name: string
  mealPlan: string
  totalPrice: number
  currency: string
}

export interface HotelRating {
  score: number
  reviewCount: number
}

export interface HotelDetail {
  id: number
  name: string
  description: string
  stars: number
  rating: HotelRating
  photos: HotelPhoto[]
  amenities: HotelAmenity[]
  schedule: HotelSchedule
  rooms: HotelRoom[]
  suggestedRoom: HotelSuggestedRoom
}

export interface HotelSearchParams {
  checkIn?: string
  checkOut?: string
  adults?: number
}

const BASE_URL = `${import.meta.env.VITE_ACCOMMODATION_API_URL as string}`

export async function getHotelById(id: string, params?: HotelSearchParams): Promise<HotelDetail> {
  const url = new URL(`${BASE_URL}/hotels/${id}`)
  if (params?.checkIn) url.searchParams.set('check_in', params.checkIn)
  if (params?.checkOut) url.searchParams.set('check_out', params.checkOut)
  if (params?.adults !== undefined) url.searchParams.set('adults', String(params.adults))

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error('Failed to fetch hotel details')
  }

  return data as HotelDetail
}
