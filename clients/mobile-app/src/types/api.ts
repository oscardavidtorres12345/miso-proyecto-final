export interface SearchFiltersQuery {
  destination: string;
  checkIn: string;
  checkOut: string;
}

export interface Amenity {
  id: string;
  name: string;
}

export interface AccommodationType {
  id: string;
  name: string;
}

export interface MealPlan {
  id: string;
  name: string;
}

export interface SearchFiltersResponse {
  amenities: Amenity[];
  accommodationTypes: AccommodationType[];
  meals: MealPlan[];
  stars: number[];
}

export interface AccommodationRating {
  score: number;
  reviewCount: number;
}

export interface AccommodationPrice {
  total: number;
  perNight: number;
  currency: string;
}

export interface Accommodation {
  id: number | string;
  name: string;
  image?: string | null;
  distanceFromCenter: number;
  stars: number;
  rating: AccommodationRating;
  amenities: Amenity[];
  hasBreakfast: boolean;
  price: AccommodationPrice;
}

export interface SearchPropertiesQuery {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  rooms?: number;
  pets?: boolean;
  priceMin?: number;
  priceMax?: number;
  amenities?: string[];
  accommodationType?: string[];
  stars?: number[];
  mealPlan?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchPropertiesResponse {
  results: Accommodation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface HotelPhoto {
  url: string;
  alt: string | null;
}

export interface HotelSchedule {
  checkIn: { from: string; to: string };
  checkOut: { time: string };
}

export interface RoomPrice {
  totalAmount: number;
  pricePerNight: number;
  currency: string;
  nights: number;
  adults: number;
  includesTaxes: boolean;
}

export interface HotelRoom {
  id: number;
  name: string;
  description: string;
  images: string[];
  price: RoomPrice;
}

export interface HotelDetail {
  id: number;
  name: string;
  description: string;
  stars: number;
  rating: AccommodationRating;
  photos: HotelPhoto[];
  amenities: Amenity[];
  schedule: HotelSchedule;
  rooms: HotelRoom[];
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  countryCode: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
}

export interface CreateHoldPayload {
  userId: string;
  roomId: number;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
}

export interface BookingHoldResponse {
  bookingId: string;
  status: string;
  expiresAt?: string;
}

export interface UserBooking {
  bookingId: string;
  hotelName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalAmount: number;
  currency: string;
}

export interface UserBookingsResponse {
  bookings: UserBooking[];
}
