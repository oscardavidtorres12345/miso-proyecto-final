import './flatListProxyMock';
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import esCO from '../../../src/i18n/locales/es-CO';

const mockGetPast = jest.fn();

jest.mock('../../../src/services/bookingService', () => ({
  getUserConfirmedPastBookings: (...args: unknown[]) => mockGetPast(...args),
}));

jest.mock('../../../src/context/AuthContext', () => {
  const authFixture = {
    session: {
      user: {
        user_id: 88,
        username: 'past-user',
      },
    },
  };
  return {
    useAuth: () => authFixture,
  };
});

jest.mock('../../../src/components/home/HomeBackground', () => ({
  HomeBackground: () => null,
}));
jest.mock('../../../src/components/common/Footer', () => ({
  Footer: () => null,
}));

jest.mock('../../../src/components/bookings/PastTripCard', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    PastTripCard: ({ accommodationName, status }: { accommodationName: string; status?: string }) => (
      <Text>{`${accommodationName}|${status ?? ''}`}</Text>
    ),
  };
});

import { PastTripsScreen } from '../../../src/screens/PastTripsScreen';

const pastTrip = {
  id: 'past-1',
  imageUrl: 'https://example.com/i.jpg',
  accommodationName: 'Casa Vieja',
  location: 'Cartagena',
  arrival: '2025-01-01',
  departure: '2025-01-08',
  guestCount: 3,
  showCancel: false,
};

describe('PastTripsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPast.mockReset();
    mockGetPast.mockResolvedValue({
      user_id: '88',
      reservations: [pastTrip],
      status: 'ok',
      sprint: 1,
      hu_id: 'hu',
    });
  });

  it('E017-04 shows past trips list with reservation cards', async () => {
    const { findByText } = render(<PastTripsScreen onNavigateToReservations={jest.fn()} />);

    await waitFor(() => expect(mockGetPast).toHaveBeenCalledWith('88'));
    await expect(findByText(esCO.bookings.pastTripsTitle)).resolves.toBeTruthy();
    await expect(findByText(`${pastTrip.accommodationName}|`)).resolves.toBeTruthy();
  });

  it('forwards the booking status to PastTripCard', async () => {
    mockGetPast.mockResolvedValue({
      user_id: '88',
      reservations: [{ ...pastTrip, status: 'CANCELLED' }],
      status: 'ok',
      sprint: 1,
      hu_id: 'hu',
    });

    const { findByText } = render(<PastTripsScreen onNavigateToReservations={jest.fn()} />);
    await expect(findByText(`${pastTrip.accommodationName}|CANCELLED`)).resolves.toBeTruthy();
  });

  it('E017-04b shows empty state when no past trips exist', async () => {
    mockGetPast.mockResolvedValue({
      user_id: '88',
      reservations: [],
      status: '',
      sprint: 0,
      hu_id: '',
    });

    const { getByText } = render(<PastTripsScreen onNavigateToReservations={jest.fn()} />);
    await waitFor(() => expect(getByText(esCO.bookings.emptyMessage)).toBeTruthy());
  });

  it('E017-04c keeps empty state when past trips request fails', async () => {
    mockGetPast.mockRejectedValue(new Error('err'));
    const { getByText } = render(<PastTripsScreen onNavigateToReservations={jest.fn()} />);
    await waitFor(() => expect(getByText(esCO.bookings.emptyMessage)).toBeTruthy());
  });

  it('E017-05 navigates back to active reservations from past trips', async () => {
    mockGetPast.mockResolvedValue({
      user_id: '88',
      reservations: [],
      status: '',
      sprint: 0,
      hu_id: '',
    });
    const onNavigateToReservations = jest.fn();

    const { findByText } = render(<PastTripsScreen onNavigateToReservations={onNavigateToReservations} />);

    fireEvent.press(await findByText(esCO.bookings.switchToCurrent));
    expect(onNavigateToReservations).toHaveBeenCalledTimes(1);
  });
});
