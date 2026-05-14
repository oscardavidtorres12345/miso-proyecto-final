import './flatListProxyMock';
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import esCO from '../../../src/i18n/locales/es-CO';

const mockGetUpcoming = jest.fn();
const mockUserCancel = jest.fn();
const mockScanCheckIn = jest.fn();
const mockManualCheckIn = jest.fn();

jest.mock('../../../src/services/bookingService', () => ({
  getUserConfirmedUpcomingBookings: (...args: unknown[]) => mockGetUpcoming(...args),
  userCancelBooking: (...args: unknown[]) => mockUserCancel(...args),
  scanBookingCheckIn: (...args: unknown[]) => mockScanCheckIn(...args),
  manualBookingCheckIn: (...args: unknown[]) => mockManualCheckIn(...args),
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
      onCheckIn,
      onManualCheckIn,
      showCancel,
      showCheckIn,
    }: {
      accommodationName: string;
      onCancel?: () => void;
      onCheckIn?: () => void;
      onManualCheckIn?: () => void;
      showCancel?: boolean;
      showCheckIn?: boolean;
    }) => (
      <>
        <Text>{accommodationName}</Text>
        {showCheckIn !== false ? (
          <TouchableOpacity accessibilityRole="button" onPress={onCheckIn}>
            <Text>{locale.bookings.checkIn}</Text>
          </TouchableOpacity>
        ) : null}
        {showCheckIn !== false ? (
          <TouchableOpacity accessibilityRole="button" onPress={onManualCheckIn}>
            <Text>{locale.bookings.manualCheckInCta}</Text>
          </TouchableOpacity>
        ) : null}
        {showCancel !== false ? (
          <TouchableOpacity accessibilityRole="button" onPress={onCancel}>
            <Text>{locale.bookings.cancelReservation}</Text>
          </TouchableOpacity>
        ) : null}
      </>
    ),
  };
});

jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [{ granted: true }, jest.fn(async () => ({ granted: true }))],
}));

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
    mockScanCheckIn.mockResolvedValue({ status: 'CHECKED_IN' });
    mockManualCheckIn.mockResolvedValue({ status: 'CHECKED_IN' });
  });

  it('E017-02 shows active reservations with main card information', async () => {
    const { findByText } = render(<MyReservationsScreen onNavigateToPastTrips={jest.fn()} />);

    await waitFor(() => expect(mockGetUpcoming).toHaveBeenCalledWith('501'));
    await expect(findByText(esCO.bookings.myReservationsTitle)).resolves.toBeTruthy();
    await expect(findByText(reservation.accommodationName)).resolves.toBeTruthy();
  });

  it('E017-10 shows empty message when user has no active reservations', async () => {
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

  it('E017-10b keeps empty state when active reservations request fails', async () => {
    mockGetUpcoming.mockRejectedValue(new Error('network'));
    const { getByText } = render(<MyReservationsScreen onNavigateToPastTrips={jest.fn()} />);
    await waitFor(() => expect(getByText(esCO.bookings.emptyMessage)).toBeTruthy());
  });

  it('E017-03 navigates to Past Trips from My Reservations', async () => {
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

  it('E017-06 and E017-07 opens modal and confirms cancellation', async () => {
    mockUserCancel.mockResolvedValueOnce({});
    const { findByText } = render(<MyReservationsScreen onNavigateToPastTrips={jest.fn()} />);

    fireEvent.press(await findByText(esCO.bookings.cancelReservation));
    fireEvent.press(await findByText(esCO.bookings.cancelReservationModalConfirm));

    await waitFor(() => expect(mockUserCancel).toHaveBeenCalledWith(reservation.id, 501));

    await expect(findByText(esCO.bookings.cancelSuccess)).resolves.toBeTruthy();
  });

  it('E017-08 dismiss button closes modal and keeps reservation unchanged', async () => {
    const { findByText, queryByText } = render(<MyReservationsScreen onNavigateToPastTrips={jest.fn()} />);
    fireEvent.press(await findByText(esCO.bookings.cancelReservation));
    fireEvent.press(await findByText(esCO.bookings.cancelReservationModalDismiss));

    await waitFor(() => expect(queryByText(esCO.bookings.cancelReservationModalTitle)).toBeNull());
    expect(mockUserCancel).not.toHaveBeenCalled();
  });

  it('E017-09 close icon closes modal and keeps reservation unchanged', async () => {
    const { findByText, getByTestId, queryByText } = render(
      <MyReservationsScreen onNavigateToPastTrips={jest.fn()} />,
    );
    fireEvent.press(await findByText(esCO.bookings.cancelReservation));
    fireEvent.press(getByTestId('modal-close-icon-btn'));

    await waitFor(() =>
      expect(queryByText(esCO.bookings.cancelReservationModalTitle)).toBeNull(),
    );
    expect(mockUserCancel).not.toHaveBeenCalled();
  });

  it('E017-07b shows error feedback when cancellation fails', async () => {
    mockUserCancel.mockRejectedValueOnce(new Error('fail'));
    const { findByText } = render(<MyReservationsScreen onNavigateToPastTrips={jest.fn()} />);

    fireEvent.press(await findByText(esCO.bookings.cancelReservation));
    fireEvent.press(await findByText(esCO.bookings.cancelReservationModalConfirm));

    await expect(findByText(esCO.bookings.cancelError)).resolves.toBeTruthy();
  });

  it('shows full-screen loading spinner while cancellation is in flight', async () => {
    let resolveCancelFn!: () => void;
    mockUserCancel.mockReturnValueOnce(
      new Promise<void>(resolve => { resolveCancelFn = resolve; }),
    );

    const { findByText, getByTestId, queryByText } = render(<MyReservationsScreen onNavigateToPastTrips={jest.fn()} />);

    fireEvent.press(await findByText(esCO.bookings.cancelReservation));
    fireEvent.press(await findByText(esCO.bookings.cancelReservationModalConfirm));

    expect(queryByText(esCO.bookings.cancelReservationModalTitle)).toBeNull();
    expect(getByTestId('cancel-loading-spinner')).toBeTruthy();

    resolveCancelFn();
    await waitFor(() => expect(mockUserCancel).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(findByText(esCO.bookings.cancelSuccess)).resolves.toBeTruthy(),
    );
  });

  it('opens scanner when pressing Realizar check in', async () => {
    const { findByText } = render(<MyReservationsScreen onNavigateToPastTrips={jest.fn()} />);
    fireEvent.press(await findByText(esCO.bookings.checkIn));
    await expect(findByText(esCO.bookings.scanQrTitle)).resolves.toBeTruthy();
    expect(mockScanCheckIn).not.toHaveBeenCalled();
  });

  it('keeps confirm button disabled when manual check-in form is incomplete', async () => {
    const { findByText, getByTestId } = render(<MyReservationsScreen onNavigateToPastTrips={jest.fn()} />);
    fireEvent.press(await findByText(esCO.bookings.manualCheckInCta));
    const confirmBtn = await getByTestId('manual-checkin-confirm-btn');
    expect(confirmBtn.props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(confirmBtn);
    expect(mockManualCheckIn).not.toHaveBeenCalled();
  });
});
