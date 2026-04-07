import type { Accommodation } from "@/types/accommodation";

export interface FilterOption {
  id: string;
}

export interface SearchFiltersResponse {
  accommodationTypes: FilterOption[];
  services: FilterOption[];
  meals: FilterOption[];
  stars: FilterOption[];
}

export interface SearchFiltersQuery {
  destination: string;
  checkIn: string;
  checkOut: string;
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
