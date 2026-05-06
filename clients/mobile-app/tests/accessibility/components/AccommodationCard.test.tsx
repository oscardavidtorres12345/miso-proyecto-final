import React from 'react';
import { render } from '@testing-library/react-native';
import { AccommodationCard } from '../../../src/components/search/AccommodationCard';

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

describe('AccommodationCard — accessibility', () => {
  describe('detail button', () => {
    it('has accessibilityRole="button"', () => {
      const { getByTestId } = render(<AccommodationCard accommodation={baseAccommodation} />);
      expect(getByTestId('accommodation-detail-btn').props.accessibilityRole).toBe('button');
    });

    it('has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(<AccommodationCard accommodation={baseAccommodation} />);
      expect(getByTestId('accommodation-detail-btn').props.accessibilityLabel).toBeTruthy();
    });

    it('has a testID', () => {
      const { getByTestId } = render(<AccommodationCard accommodation={baseAccommodation} />);
      expect(getByTestId('accommodation-detail-btn')).toBeTruthy();
    });
  });

  describe('accommodation image', () => {
    it('has accessibilityLabel with the accommodation name', () => {
      const { getByTestId } = render(<AccommodationCard accommodation={baseAccommodation} />);
      expect(getByTestId('accommodation-image').props.accessibilityLabel).toBe('Hotel Central');
    });

    it('has a testID', () => {
      const { getByTestId } = render(<AccommodationCard accommodation={baseAccommodation} />);
      expect(getByTestId('accommodation-image')).toBeTruthy();
    });

    it('placeholder image has accessibilityLabel when no image is provided', () => {
      const noImage = { ...baseAccommodation, image: null };
      const { getByTestId } = render(<AccommodationCard accommodation={noImage} />);
      expect(getByTestId('accommodation-image').props.accessibilityLabel).toBeTruthy();
    });
  });
});
