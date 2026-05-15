import '../screens/flatListProxyMock';
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { setLocale } from '../../../src/i18n';
import esCO from '../../../src/i18n/locales/es-CO';
import enUS from '../../../src/i18n/locales/en-US';

jest.mock('../../../src/services/identityService');
jest.mock('../../../src/services/bookingService');
jest.mock('../../../src/services/searchService');

const mockUseAuth = jest.fn();
jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../../src/components/home/HomeBackground', () => ({
  HomeBackground: () => null,
}));
jest.mock('../../../src/components/common/Footer', () => ({
  Footer: () => null,
}));
jest.mock('../../../src/components/common/Modal', () => ({
  ConfirmModal: () => null,
}));
jest.mock('../../../src/components/common/Snackbar', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Snackbar: ({ show, message }: { show: boolean; message: string }) =>
      show ? <Text testID="snackbar">{message}</Text> : null,
  };
});
jest.mock('../../../src/components/bookings/ReservationCard', () => ({
  ReservationCard: () => null,
}));
jest.mock('../../../src/components/bookings/PastTripCard', () => ({
  PastTripCard: () => null,
}));
jest.mock('../../../src/components/search/AccommodationCard', () => ({
  AccommodationCard: () => null,
}));
jest.mock('../../../src/components/search/SearchSummaryBar', () => ({
  SearchSummaryBar: () => null,
}));
jest.mock('../../../src/components/search/FilterPanel', () => ({
  FilterPanel: () => null,
}));
jest.mock('../../../src/components/search/SearchBottomSheet', () => ({
  SearchBottomSheet: () => null,
}));
jest.mock('../../../src/components/search/Pagination', () => ({
  Pagination: () => null,
}));
jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [{ granted: false }, jest.fn()],
}));

import { HomeScreen } from '../../../src/screens/HomeScreen';
import { LoginScreen } from '../../../src/screens/LoginScreen';
import { SearchScreen } from '../../../src/screens/SearchScreen';
import { MyReservationsScreen } from '../../../src/screens/MyReservationsScreen';
import { PastTripsScreen } from '../../../src/screens/PastTripsScreen';
import {
  getUserConfirmedUpcomingBookings,
  getUserConfirmedPastBookings,
} from '../../../src/services/bookingService';
import { getSearchFilters, getSearchProperties } from '../../../src/services/searchService';

const emptyBookingsResponse = {
  user_id: '1',
  reservations: [],
  status: 'ok',
  sprint: 1,
  hu_id: 'hu',
};

const emptySearchResponse = {
  amenities: [],
  accommodationTypes: [],
  meals: [],
  stars: [],
};

const emptyPropertiesResponse = {
  results: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

const authSession = { session: { user: { user_id: 1, username: 'test' } } };

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue(authSession);
  (getUserConfirmedUpcomingBookings as jest.Mock).mockResolvedValue(emptyBookingsResponse);
  (getUserConfirmedPastBookings as jest.Mock).mockResolvedValue(emptyBookingsResponse);
  (getSearchFilters as jest.Mock).mockResolvedValue(emptySearchResponse);
  (getSearchProperties as jest.Mock).mockResolvedValue(emptyPropertiesResponse);
});

afterEach(async () => {
  await setLocale('es-CO');
});

describe('HomeScreen i18n snapshots', () => {
  it('renders in es-CO', async () => {
    await setLocale('es-CO');
    const { toJSON } = render(<HomeScreen onNavigateToSearch={jest.fn()} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders in en-US', async () => {
    await setLocale('en-US');
    const { toJSON } = render(<HomeScreen onNavigateToSearch={jest.fn()} />);
    expect(toJSON()).toMatchSnapshot();
  });
});

describe('LoginScreen i18n snapshots', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ setAuthData: jest.fn() });
  });

  it('renders in es-CO', async () => {
    await setLocale('es-CO');
    const { toJSON } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders in en-US', async () => {
    await setLocale('en-US');
    const { toJSON } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
    expect(toJSON()).toMatchSnapshot();
  });
});

describe('SearchScreen i18n snapshots', () => {
  const searchParams = {
    destination: 'Bogota',
    checkIn: '2025-12-01',
    checkOut: '2025-12-05',
    adults: 2,
    children: 0,
    rooms: 1,
    pets: false,
  };

  it('renders empty state in es-CO', async () => {
    await setLocale('es-CO');
    const { toJSON, getByText } = render(
      <SearchScreen params={searchParams} _onBack={jest.fn()} />,
    );
    await waitFor(() => getByText(esCO.search.noResults));
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders empty state in en-US', async () => {
    await setLocale('en-US');
    const { toJSON, getByText } = render(
      <SearchScreen params={searchParams} _onBack={jest.fn()} />,
    );
    await waitFor(() => getByText(enUS.search.noResults));
    expect(toJSON()).toMatchSnapshot();
  });
});

describe('MyReservationsScreen i18n snapshots', () => {
  it('renders in es-CO', async () => {
    await setLocale('es-CO');
    const { toJSON, findByText } = render(
      <MyReservationsScreen onNavigateToPastTrips={jest.fn()} />,
    );
    await findByText(esCO.bookings.myReservationsTitle);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders in en-US', async () => {
    await setLocale('en-US');
    const { toJSON, findByText } = render(
      <MyReservationsScreen onNavigateToPastTrips={jest.fn()} />,
    );
    await findByText(enUS.bookings.myReservationsTitle);
    expect(toJSON()).toMatchSnapshot();
  });
});

describe('PastTripsScreen i18n snapshots', () => {
  it('renders in es-CO', async () => {
    await setLocale('es-CO');
    const { toJSON, findByText } = render(
      <PastTripsScreen onNavigateToReservations={jest.fn()} />,
    );
    await findByText(esCO.bookings.pastTripsTitle);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders in en-US', async () => {
    await setLocale('en-US');
    const { toJSON, findByText } = render(
      <PastTripsScreen onNavigateToReservations={jest.fn()} />,
    );
    await findByText(enUS.bookings.pastTripsTitle);
    expect(toJSON()).toMatchSnapshot();
  });
});
