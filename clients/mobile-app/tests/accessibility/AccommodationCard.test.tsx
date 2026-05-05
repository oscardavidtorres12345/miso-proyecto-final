import React from 'react';
import { render } from '@testing-library/react-native';
import { AccommodationCard } from '../../src/components/search/AccommodationCard';

const baseAccommodation: any = {
  id: 1,
  name: 'Hotel Central',
  image: 'https://example.com/hotel.jpg',
  distanceFromCenter: 1.2,
  stars: 4,
  rating: { score: 8.7, reviewCount: 12 },
  amenities: [{ id: 'wifi', name: 'Wifi' }],
  hasBreakfast: false,
  price: { perNight: 300000, currency: 'COP' },
};

describe('AccommodationCard — accesibilidad', () => {
  describe('botón de detalle', () => {
    it('tiene accessibilityRole="button"', () => {
      const { getByTestId } = render(<AccommodationCard accommodation={baseAccommodation} />);
      expect(getByTestId('accommodation-detail-btn').props.accessibilityRole).toBe('button');
    });

    it('tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(<AccommodationCard accommodation={baseAccommodation} />);
      expect(getByTestId('accommodation-detail-btn').props.accessibilityLabel).toBeTruthy();
    });

    it('tiene testID para ser referenciado', () => {
      const { getByTestId } = render(<AccommodationCard accommodation={baseAccommodation} />);
      expect(getByTestId('accommodation-detail-btn')).toBeTruthy();
    });
  });

  describe('imagen del alojamiento', () => {
    it('tiene accessibilityLabel con el nombre del alojamiento', () => {
      const { getByTestId } = render(<AccommodationCard accommodation={baseAccommodation} />);
      expect(getByTestId('accommodation-image').props.accessibilityLabel).toBe('Hotel Central');
    });

    it('tiene testID para ser referenciado', () => {
      const { getByTestId } = render(<AccommodationCard accommodation={baseAccommodation} />);
      expect(getByTestId('accommodation-image')).toBeTruthy();
    });

    it('imagen placeholder tiene accessibilityLabel cuando no hay imagen', () => {
      const noImage = { ...baseAccommodation, image: null };
      const { getByTestId } = render(<AccommodationCard accommodation={noImage} />);
      expect(getByTestId('accommodation-image').props.accessibilityLabel).toBeTruthy();
    });
  });
});
