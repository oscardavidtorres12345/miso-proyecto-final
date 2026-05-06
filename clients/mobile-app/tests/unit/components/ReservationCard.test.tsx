import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { setLocale } from '../../../src/i18n';
import { ReservationCard } from '../../../src/components/bookings/ReservationCard';
import esCO from '../../../src/i18n/locales/es-CO';

describe('ReservationCard', () => {
  const base = {
    id: '1',
    imageUrl: 'https://example.com/img.jpg',
    accommodationName: 'Hotel Prueba',
    location: 'Medellín',
    arrival: new Date(2026, 4, 1),
    departure: new Date(2026, 4, 5),
    guestCount: 2,
  };

  beforeEach(() => setLocale('es-CO'));

  afterEach(() => setLocale('es-CO'));

  it('renders accommodation, location and guest plural text', () => {
    const { getByText } = render(<ReservationCard {...base} />);
    expect(getByText('Hotel Prueba')).toBeTruthy();
    expect(getByText('Medellín')).toBeTruthy();
    expect(getByText('2 huéspedes')).toBeTruthy();
    expect(getByText(esCO.bookings.cancelReservation)).toBeTruthy();
  });

  it('uses singular guest text for one guest', () => {
    const { getByText } = render(<ReservationCard {...base} guestCount={1} />);
    expect(getByText('1 huésped')).toBeTruthy();
  });

  it('hides cancel when showCancel is false', () => {
    const { queryByText } = render(<ReservationCard {...base} showCancel={false} />);
    expect(queryByText(esCO.bookings.cancelReservation)).toBeNull();
  });

  it('fires onCancel when cancel is pressed', () => {
    const onCancel = jest.fn();
    const { getByText } = render(<ReservationCard {...base} onCancel={onCancel} />);
    fireEvent.press(getByText(esCO.bookings.cancelReservation));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
