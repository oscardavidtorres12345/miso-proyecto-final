import './flatListProxyMock';
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import esCO from '../../../src/i18n/locales/es-CO';

const mockGetUpcoming = jest.fn();
const mockUserCancel = jest.fn();

jest.mock('../../../src/services/bookingService', () => ({
  getUserConfirmedUpcomingBookings: (...args: unknown[]) => mockGetUpcoming(...args),
  userCancelBooking: (...args: unknown[]) => mockUserCancel(...args),
}));

jest.mock('../../../src/context/AuthContext', () => {
  const authFixture = {
    session: {
      user: {
        user_id: 501,
        username: 'usuario',
      },
    },
  };
  return { useAuth: () => authFixture };
});

jest.mock('../../../src/components/home/HomeBackground', () => ({
  HomeBackground: () => null,
}));
jest.mock('../../../src/components/common/Footer', () => ({
  Footer: () => null,
}));

jest.mock('../../../src/components/bookings/ReservationCard', () => {
  const React = require('react');
  const { Text, TouchableOpacity } = require('react-native');
  const locale = require('../../../src/i18n/locales/es-CO').default;
  return {
    ReservationCard: ({
      accommodationName,
      onCancel,
      showCancel,
    }: {
      accommodationName: string;
      onCancel?: () => void;
      showCancel?: boolean;
    }) => (
      <>
        <Text>{accommodationName}</Text>
        {showCancel !== false ? (
          <TouchableOpacity accessibilityRole="button" onPress={onCancel}>
            <Text>{locale.bookings.cancelReservation}</Text>
          </TouchableOpacity>
        ) : null}
      </>
    ),
  };
});

jest.mock('../../../src/components/common/Snackbar', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Snackbar = ({ show, message }: { show: boolean; message: string }) =>
    show ? <Text testID="snackbar-message">{message}</Text> : null;
  return { Snackbar };
});

import { MyReservationsScreen } from '../../../src/screens/MyReservationsScreen';

const reservation = {
  id: 'booking-xyz',
  imageUrl: 'https://picsum.photos/200',
  accommodationName: 'Apartamento Centro',
  location: 'Bogotá',
  arrival: '2026-07-01T00:00:00.000Z',
  departure: '2026-07-10T00:00:00.000Z',
  guestCount: 2,
  showCancel: true,
};

describe('MyReservationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUpcoming.mockReset();
    mockUserCancel.mockReset();
    mockGetUpcoming.mockResolvedValue({
      user_id: '501',
      reservations: [reservation],
      status: 'ok',
      sprint: 1,
      hu_id: 'hu',
    });
  });

  it('loads and renders reservation titles', async () => {
    const { findByText } = render(<MyReservationsScreen onNavigateToPastTrips={jest.fn()} />);

    await waitFor(() => expect(mockGetUpcoming).toHaveBeenCalledWith('501'));
    await expect(findByText(esCO.bookings.myReservationsTitle)).resolves.toBeTruthy();
    await expect(findByText(reservation.accommodationName)).resolves.toBeTruthy();
  });

  it('renders empty message when fetch returns no reservations', async () => {
    mockGetUpcoming.mockResolvedValue({
      user_id: '501',
      reservations: [],
      status: 'ok',
      sprint: 1,
      hu_id: 'hu',
    });
    const { getByText } = render(<MyReservationsScreen onNavigateToPastTrips={jest.fn()} />);
    await waitFor(() => expect(getByText(esCO.bookings.emptyMessage)).toBeTruthy());
  });

  it('renders empty when fetch rejects', async () => {
    mockGetUpcoming.mockRejectedValue(new Error('network'));
    const { getByText } = render(<MyReservationsScreen onNavigateToPastTrips={jest.fn()} />);
    await waitFor(() => expect(getByText(esCO.bookings.emptyMessage)).toBeTruthy());
  });

  it('calls onNavigateToPastTrips from switch button', async () => {
    const navigate = jest.fn();
    mockGetUpcoming.mockResolvedValue({
      user_id: '501',
      reservations: [],
      status: '',
      sprint: 0,
      hu_id: '',
    });
    const { findByText } = render(<MyReservationsScreen onNavigateToPastTrips={navigate} />);
    fireEvent.press(await findByText(esCO.bookings.switchToPast));
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('opens confirm modal and cancels reservation on confirm', async () => {
    mockUserCancel.mockResolvedValueOnce({});
    const { findByText } = render(<MyReservationsScreen onNavigateToPastTrips={jest.fn()} />);

    fireEvent.press(await findByText(esCO.bookings.cancelReservation));
    fireEvent.press(await findByText(esCO.bookings.cancelReservationModalConfirm));

    await waitFor(() => expect(mockUserCancel).toHaveBeenCalledWith(reservation.id, 501));

    await expect(findByText(esCO.bookings.cancelSuccess)).resolves.toBeTruthy();
  });

  it('closes modal from dismiss button without calling cancel API', async () => {
    const { findByText, queryByText } = render(<MyReservationsScreen onNavigateToPastTrips={jest.fn()} />);
    fireEvent.press(await findByText(esCO.bookings.cancelReservation));
    fireEvent.press(await findByText(esCO.bookings.cancelReservationModalDismiss));

    await waitFor(() => expect(queryByText(esCO.bookings.cancelReservationModalTitle)).toBeNull());
    expect(mockUserCancel).not.toHaveBeenCalled();
  });

  it('shows error snackbar when cancel fails', async () => {
    mockUserCancel.mockRejectedValueOnce(new Error('fail'));
    const { findByText } = render(<MyReservationsScreen onNavigateToPastTrips={jest.fn()} />);

    fireEvent.press(await findByText(esCO.bookings.cancelReservation));
    fireEvent.press(await findByText(esCO.bookings.cancelReservationModalConfirm));

    await expect(findByText(esCO.bookings.cancelError)).resolves.toBeTruthy();
  });
});
