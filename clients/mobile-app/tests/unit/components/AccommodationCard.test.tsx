import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Image } from 'react-native';

import { AccommodationCard } from '../../../src/components/search/AccommodationCard';

const baseAccommodation: any = {
  id: 99,
  name: 'Hotel Central',
  image: 'https://example.com/hotel.jpg',
  distanceFromCenter: 1.2,
  stars: 4,
  rating: { score: 8.7, reviewCount: 12 },
  amenities: [{ id: 'wifi', name: 'Wifi' }, { id: 'pool', name: 'Piscina' }],
  hasBreakfast: true,
  price: { perNight: 300000, currency: 'COP' },
};

describe('AccommodationCard', () => {
  it('renders main info and triggers detail callback', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AccommodationCard accommodation={baseAccommodation} onPress={onPress} nights={2} adults={2} />,
    );

    expect(getByText('Hotel Central')).toBeTruthy();
    expect(getByText('12 comentarios')).toBeTruthy();
    expect(getByText('2 noches, 2 adultos')).toBeTruthy();
    expect(getByText('Incluye impuestos y cargos')).toBeTruthy();

    fireEvent.press(getByText('Ver detalles'));
    expect(onPress).toHaveBeenCalledWith(99);
  });

  it('falls back when image errors and handles singular labels', () => {
    const accommodation = {
      ...baseAccommodation,
      rating: { score: 9.4, reviewCount: 1 },
      price: { perNight: 120000, currency: '' },
    };

    const { UNSAFE_getAllByType, getByText } = render(
      <AccommodationCard accommodation={accommodation} nights={1} adults={1} />,
    );

    const images = UNSAFE_getAllByType(Image);
    fireEvent(images[0], 'error');
    expect(getByText('1 comentario')).toBeTruthy();
    expect(getByText('1 noche, 1 adulto')).toBeTruthy();
  });

  it('covers remaining rating label branches', () => {
    const { rerender, getByText } = render(
      <AccommodationCard accommodation={{ ...baseAccommodation, rating: { score: 7.2, reviewCount: 2 } }} />,
    );
    expect(getByText('Muy bien')).toBeTruthy();

    rerender(
      <AccommodationCard accommodation={{ ...baseAccommodation, rating: { score: 5.6, reviewCount: 2 } }} />,
    );
    expect(getByText('Bien')).toBeTruthy();

    rerender(
      <AccommodationCard accommodation={{ ...baseAccommodation, rating: { score: 4.2, reviewCount: 2 } }} />,
    );
    expect(getByText('Aceptable')).toBeTruthy();
  });

  it('covers fallbacks for name, amenities and price sources', () => {
    const accommodation = {
      ...baseAccommodation,
      name: null,
      stars: null,
      amenities: [{ id: 'unknown', name: 'Unknown' }, { id: 'wifi', name: 'WiFi' }],
      price: { amount: 456000, currency: 'USD', nights: 3, adults: 4 },
      rating: {},
    };
    const { getAllByText, getByText, queryByText, rerender } = render(
      <AccommodationCard accommodation={accommodation as any} />,
    );

    expect(getAllByText('–').length).toBeGreaterThan(0);
    expect(getByText('3 noches, 4 adultos')).toBeTruthy();
    expect(getByText('456.000')).toBeTruthy();
    expect(getByText('USD')).toBeTruthy();
    expect(queryByText('Excepcional')).toBeNull();

    rerender(
      <AccommodationCard
        accommodation={{ ...accommodation, price: { total: 789000, currency: '' } } as any}
      />,
    );
    expect(getByText('789.000')).toBeTruthy();
  });

  it('covers null/undefined amenities and price fallback branches', () => {
    const fallbackAccommodation = {
      ...baseAccommodation,
      amenities: undefined,
      price: null,
      rating: { score: undefined, reviewCount: undefined },
    };
    const { getAllByText, getByText, rerender } = render(
      <AccommodationCard accommodation={fallbackAccommodation as any} />,
    );

    expect(getAllByText('–').length).toBeGreaterThan(0);

    rerender(
      <AccommodationCard
        accommodation={{
          ...baseAccommodation,
          amenities: [{ id: undefined, name: 'No icon' } as any, { id: 'wifi', name: 'WiFi' }],
          price: { amount: undefined, total: 950000, currency: 'COP' },
        } as any}
      />,
    );
    expect(getByText('950.000')).toBeTruthy();
  });
});
