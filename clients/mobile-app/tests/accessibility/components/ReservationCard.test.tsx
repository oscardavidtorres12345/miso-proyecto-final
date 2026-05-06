import React from 'react';
import { render } from '@testing-library/react-native';
import { ReservationCard } from '../../../src/components/bookings/ReservationCard';

const baseProps = {
  id: 'r1',
  imageUrl: 'https://example.com/hotel.jpg',
  accommodationName: 'Hotel Central',
  location: 'Bogotá, Colombia',
  arrival: new Date('2025-06-01'),
  departure: new Date('2025-06-05'),
  guestCount: 2,
  showCancel: true,
  onCancel: jest.fn(),
};

describe('ReservationCard — accessibility', () => {
  describe('cancel button', () => {
    it('has accessibilityRole="button"', () => {
      const { getByTestId } = render(<ReservationCard {...baseProps} />);
      expect(getByTestId('reservation-cancel-btn').props.accessibilityRole).toBe('button');
    });

    it('has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(<ReservationCard {...baseProps} />);
      expect(getByTestId('reservation-cancel-btn').props.accessibilityLabel).toBeTruthy();
    });

    it('has a testID', () => {
      const { getByTestId } = render(<ReservationCard {...baseProps} />);
      expect(getByTestId('reservation-cancel-btn')).toBeTruthy();
    });

    it('does not render when showCancel is false', () => {
      const { queryByTestId } = render(<ReservationCard {...baseProps} showCancel={false} />);
      expect(queryByTestId('reservation-cancel-btn')).toBeNull();
    });
  });

  describe('reservation image', () => {
    it('has accessibilityLabel with the accommodation name', () => {
      const { getByTestId } = render(<ReservationCard {...baseProps} />);
      expect(getByTestId('reservation-image').props.accessibilityLabel).toBe('Hotel Central');
    });

    it('has a testID', () => {
      const { getByTestId } = render(<ReservationCard {...baseProps} />);
      expect(getByTestId('reservation-image')).toBeTruthy();
    });
  });
});
