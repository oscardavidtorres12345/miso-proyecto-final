import React from 'react';
import { render } from '@testing-library/react-native';
import { ReservationCard } from '../../src/components/bookings/ReservationCard';

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

describe('ReservationCard — accesibilidad', () => {
  describe('botón de cancelar', () => {
    it('tiene accessibilityRole="button"', () => {
      const { getByTestId } = render(<ReservationCard {...baseProps} />);
      expect(getByTestId('reservation-cancel-btn').props.accessibilityRole).toBe('button');
    });

    it('tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(<ReservationCard {...baseProps} />);
      expect(getByTestId('reservation-cancel-btn').props.accessibilityLabel).toBeTruthy();
    });

    it('tiene testID para ser referenciado', () => {
      const { getByTestId } = render(<ReservationCard {...baseProps} />);
      expect(getByTestId('reservation-cancel-btn')).toBeTruthy();
    });

    it('no renderiza el botón cuando showCancel es false', () => {
      const { queryByTestId } = render(<ReservationCard {...baseProps} showCancel={false} />);
      expect(queryByTestId('reservation-cancel-btn')).toBeNull();
    });
  });

  describe('imagen de la reserva', () => {
    it('tiene accessibilityLabel con el nombre del alojamiento', () => {
      const { getByTestId } = render(<ReservationCard {...baseProps} />);
      expect(getByTestId('reservation-image').props.accessibilityLabel).toBe('Hotel Central');
    });

    it('tiene testID para ser referenciado', () => {
      const { getByTestId } = render(<ReservationCard {...baseProps} />);
      expect(getByTestId('reservation-image')).toBeTruthy();
    });
  });
});
