import React from 'react';
import { render } from '@testing-library/react-native';
import { PastTripCard } from '../../src/components/bookings/PastTripCard';

const baseProps = {
  imageUrl: 'https://example.com/hotel.jpg',
  accommodationName: 'Hotel Cartagena',
  location: 'Cartagena, Colombia',
  arrival: new Date('2024-12-20'),
  departure: new Date('2024-12-26'),
  guestCount: 3,
};

describe('PastTripCard — accesibilidad', () => {
  describe('imagen del viaje', () => {
    it('tiene accessibilityLabel con el nombre del alojamiento', () => {
      const { getByTestId } = render(<PastTripCard {...baseProps} />);
      expect(getByTestId('past-trip-image').props.accessibilityLabel).toBe('Hotel Cartagena');
    });

    it('tiene testID para ser referenciado', () => {
      const { getByTestId } = render(<PastTripCard {...baseProps} />);
      expect(getByTestId('past-trip-image')).toBeTruthy();
    });

    it('el accessibilityLabel refleja el nombre del alojamiento correcto', () => {
      const differentProps = { ...baseProps, accommodationName: 'Hotel Medellín' };
      const { getByTestId } = render(<PastTripCard {...differentProps} />);
      expect(getByTestId('past-trip-image').props.accessibilityLabel).toBe('Hotel Medellín');
    });
  });

  it('renderiza sin errores (no tiene elementos interactivos)', () => {
    const { UNSAFE_root } = render(<PastTripCard {...baseProps} />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
