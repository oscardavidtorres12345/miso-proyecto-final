import React from 'react';
import { render } from '@testing-library/react-native';
import { setLocale } from '../../../src/i18n';
import { PastTripCard } from '../../../src/components/bookings/PastTripCard';

describe('PastTripCard', () => {
  beforeEach(() => setLocale('es-CO'));

  afterEach(() => setLocale('es-CO'));

  it('renders accommodation, location and guest count', () => {
    const { getByText } = render(
      <PastTripCard
        imageUrl="https://x"
        accommodationName='Cabaña Norte'
        location="Santa Marta"
        arrival={new Date(2026, 2, 10)}
        departure={new Date(2026, 2, 14)}
        guestCount={4}
      />,
    );
    expect(getByText('Cabaña Norte')).toBeTruthy();
    expect(getByText('Santa Marta')).toBeTruthy();
    expect(getByText('4 huéspedes')).toBeTruthy();
  });

  it('renders the cancelled pill when status is CANCELLED', () => {
    const { getByText } = render(
      <PastTripCard
        imageUrl="https://x"
        accommodationName='Cabaña Norte'
        location="Santa Marta"
        arrival={new Date(2026, 2, 10)}
        departure={new Date(2026, 2, 14)}
        guestCount={4}
        status="CANCELLED"
      />,
    );
    expect(getByText('Cancelada')).toBeTruthy();
  });

  it('does not render the cancelled pill when status is missing or not CANCELLED', () => {
    const { queryByText, rerender } = render(
      <PastTripCard
        imageUrl="https://x"
        accommodationName='Cabaña Norte'
        location="Santa Marta"
        arrival={new Date(2026, 2, 10)}
        departure={new Date(2026, 2, 14)}
        guestCount={4}
      />,
    );
    expect(queryByText('Cancelada')).toBeNull();
    expect(queryByText('Cancelled')).toBeNull();

    rerender(
      <PastTripCard
        imageUrl="https://x"
        accommodationName='Cabaña Norte'
        location="Santa Marta"
        arrival={new Date(2026, 2, 10)}
        departure={new Date(2026, 2, 14)}
        guestCount={4}
        status="CONFIRMED"
      />,
    );
    expect(queryByText('Cancelada')).toBeNull();
  });
});
