export interface Amenity {
  id: string
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
