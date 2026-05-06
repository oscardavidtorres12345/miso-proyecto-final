import React from 'react';
import { render } from '@testing-library/react-native';
import { PastTripCard } from '../../../src/components/bookings/PastTripCard';

const baseProps = {
  imageUrl: 'https://example.com/hotel.jpg',
  accommodationName: 'Hotel Cartagena',
  location: 'Cartagena, Colombia',
  arrival: new Date('2024-12-20'),
  departure: new Date('2024-12-26'),
  guestCount: 3,
};

describe('PastTripCard — accessibility', () => {
  describe('trip image', () => {
    it('has accessibilityLabel with the accommodation name', () => {
      const { getByTestId } = render(<PastTripCard {...baseProps} />);
      expect(getByTestId('past-trip-image').props.accessibilityLabel).toBe('Hotel Cartagena');
    });

    it('has a testID', () => {
      const { getByTestId } = render(<PastTripCard {...baseProps} />);
      expect(getByTestId('past-trip-image')).toBeTruthy();
    });

    it('accessibilityLabel reflects the correct accommodation name', () => {
      const differentProps = { ...baseProps, accommodationName: 'Hotel Medellín' };
      const { getByTestId } = render(<PastTripCard {...differentProps} />);
      expect(getByTestId('past-trip-image').props.accessibilityLabel).toBe('Hotel Medellín');
    });
  });

  it('renders without errors (no interactive elements)', () => {
    const { UNSAFE_root } = render(<PastTripCard {...baseProps} />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
