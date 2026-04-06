export interface Amenity {
  id: string
  label?: string
}

export interface HotelPhoto {
  url: string
  alt?: string
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

export interface Room {
  id: string
  name: string
  description: string
  images: string[]
  price: RoomPrice
}

export interface HotelDetail {
  id: string
  name: string
  description: string
  stars: number
  rating: AccommodationRating
  photos: HotelPhoto[]
  amenities: Amenity[]
  schedule: HotelSchedule
  rooms: Room[]
  suggestedRoom?: {
    name: string
    mealPlan: string
    totalPrice: number
    currency: string
  }
}

export interface AccommodationRating {
  score: number
  reviewCount: number
}

export interface AccommodationPrice {
  amount: number
  currency: string
  nights: number
  adults: number
  includesTaxes: boolean
}

export interface Accommodation {
  id: string
  name: string
  image: string
  distanceFromCenter: number
  stars: number
  rating: AccommodationRating
  amenities: Amenity[]
  hasBreakfast: boolean
  price: AccommodationPrice
}
