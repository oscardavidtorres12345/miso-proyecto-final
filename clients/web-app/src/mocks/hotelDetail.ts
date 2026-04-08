import type { HotelDetail } from '@/types/accommodation'

export const MOCK_HOTEL_DETAILS: Record<string, HotelDetail> = {
  '1': {
    id: '1',
    name: 'Aonang Villa Resort',
    description:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
    stars: 4,
    rating: { score: 4.2, reviewCount: 200 },
    photos: [
      { url: 'https://picsum.photos/seed/hotel1a/1200/600', alt: 'Aonang Villa Resort - Vista principal' },
      { url: 'https://picsum.photos/seed/hotel1b/1200/600', alt: 'Aonang Villa Resort - Piscina' },
      { url: 'https://picsum.photos/seed/hotel1c/1200/600', alt: 'Aonang Villa Resort - Restaurante' },
    ],
    amenities: [
      { id: 'wifi', label: 'WiFi gratuito' },
      { id: 'pool', label: 'Piscina' },
      { id: 'transfer', label: 'Traslado al aeropuerto' },
      { id: 'parking', label: 'Parqueadero' },
      { id: 'gym', label: 'Gimnasio' },
      { id: 'spa', label: 'Spa' },
      { id: 'restaurant', label: 'Restaurante' },
      { id: 'ac', label: 'Aire acondicionado' },
      { id: 'breakfast', label: 'Desayuno incluido' },
    ],
    schedule: {
      checkIn: { from: '15:00', to: '23:59' },
      checkOut: { time: '13:00' },
    },
    rooms: [
      {
        id: 'r1',
        name: 'Suite Junior',
        description: 'Amplia suite con vista al jardín, cama king size y baño privado con bañera.',
        images: [
          'https://picsum.photos/seed/room1a/600/400',
          'https://picsum.photos/seed/room1b/600/400',
        ],
        price: {
          totalAmount: 5000000,
          pricePerNight: 208333,
          currency: 'COP',
          nights: 24,
          adults: 2,
          includesTaxes: true,
        },
      },
      {
        id: 'r2',
        name: 'Habitación Doble Estándar',
        description: 'Habitación confortable con dos camas matrimoniales y vista a la piscina.',
        images: [
          'https://picsum.photos/seed/room2a/600/400',
          'https://picsum.photos/seed/room2b/600/400',
        ],
        price: {
          totalAmount: 3800000,
          pricePerNight: 158333,
          currency: 'COP',
          nights: 24,
          adults: 2,
          includesTaxes: true,
        },
      },
      {
        id: 'r3',
        name: 'Suite Presidencial',
        description: 'La suite más lujosa del hotel con terraza privada, sala de estar y jacuzzi.',
        images: [
          'https://picsum.photos/seed/room3a/600/400',
          'https://picsum.photos/seed/room3b/600/400',
        ],
        price: {
          totalAmount: 9500000,
          pricePerNight: 395833,
          currency: 'COP',
          nights: 24,
          adults: 2,
          includesTaxes: true,
        },
      },
    ],
    suggestedRoom: {
      name: 'Suite Junior',
      mealPlan: 'Desayuno',
      totalPrice: 5000000,
      currency: 'COP',
    },
  },
}
