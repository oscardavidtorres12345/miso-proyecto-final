import React from 'react';
import { render } from '@testing-library/react-native';
import { MyReservationsScreen } from '../../../src/screens/MyReservationsScreen';

jest.mock('../../../src/services/bookingService', () => ({
  getUserConfirmedUpcomingBookings: jest.fn().mockResolvedValue({ reservations: [] }),
  userCancelBooking: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => ({ session: { user: { user_id: 1 } } }),
}));
jest.mock('../../../src/components/home/HomeBackground', () => ({
  HomeBackground: () => null,
}));
jest.mock('../../../src/components/common/Footer', () => ({
  Footer: () => null,
}));
jest.mock('../../../src/components/bookings/ReservationCard', () => ({
  ReservationCard: () => null,
}));
jest.mock('../../../src/components/common/Modal', () => ({
  ConfirmModal: () => null,
}));
jest.mock('../../../src/components/common/Snackbar', () => ({
  Snackbar: () => null,
}));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('MyReservationsScreen — accesibilidad', () => {
  it('renderiza sin errores', () => {
    const { UNSAFE_root } = render(
      <MyReservationsScreen onNavigateToPastTrips={jest.fn()} />,
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('el botón de cambio a viajes pasados tiene accessibilityRole="button"', () => {
    const { getByTestId } = render(
      <MyReservationsScreen onNavigateToPastTrips={jest.fn()} />,
    );
    expect(getByTestId('switch-to-past-trips-btn').props.accessibilityRole).toBe('button');
  });

  it('el botón de cambio a viajes pasados tiene accessibilityLabel descriptivo', () => {
    const { getByTestId } = render(
      <MyReservationsScreen onNavigateToPastTrips={jest.fn()} />,
    );
    expect(getByTestId('switch-to-past-trips-btn').props.accessibilityLabel).toBeTruthy();
  });
});
