import React from 'react';
import { render } from '@testing-library/react-native';
import { PastTripsScreen } from '../../../src/screens/PastTripsScreen';

jest.mock('../../../src/services/bookingService', () => ({
  getUserConfirmedPastBookings: jest.fn().mockResolvedValue({ reservations: [] }),
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
jest.mock('../../../src/components/bookings/PastTripCard', () => ({
  PastTripCard: () => null,
}));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('PastTripsScreen — accessibility', () => {
  it('renders without errors', () => {
    const { UNSAFE_root } = render(
      <PastTripsScreen onNavigateToReservations={jest.fn()} />,
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('switch to reservations button has accessibilityRole="button"', () => {
    const { getByTestId } = render(
      <PastTripsScreen onNavigateToReservations={jest.fn()} />,
    );
    expect(getByTestId('switch-to-reservations-btn').props.accessibilityRole).toBe('button');
  });

  it('switch to reservations button has a descriptive accessibilityLabel', () => {
    const { getByTestId } = render(
      <PastTripsScreen onNavigateToReservations={jest.fn()} />,
    );
    expect(getByTestId('switch-to-reservations-btn').props.accessibilityLabel).toBeTruthy();
  });
});
