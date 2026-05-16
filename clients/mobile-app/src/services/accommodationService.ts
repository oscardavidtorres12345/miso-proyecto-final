import { API_CONFIG } from '../config/api';
import type { HotelDetail } from '../types/api';

const BASE_URL = API_CONFIG.ACCOMMODATION_URL;

export interface HotelSearchParams {
  checkIn?: string;
  checkOut?: string;
  adults?: number;
}

export async function getHotelById(id: string, params?: HotelSearchParams): Promise<HotelDetail> {
  const url = new URL(`${BASE_URL}/hotels/${id}`);
  if (params?.checkIn) url.searchParams.set('check_in', params.checkIn);
  if (params?.checkOut) url.searchParams.set('check_out', params.checkOut);
  if (params?.adults !== undefined) url.searchParams.set('adults', String(params.adults));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch hotel details');
  }

  return (await response.json()) as HotelDetail;
}
