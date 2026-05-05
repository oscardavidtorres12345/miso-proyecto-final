import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { SearchScreen } from '../../../src/screens/SearchScreen';
import * as searchService from '../../../src/services/searchService';

jest.mock('../../../src/services/searchService');

jest.mock('../../../src/components/search/SearchBottomSheet', () => ({
  SearchBottomSheet: () => null,
}));
jest.mock('../../../src/components/search/FilterPanel', () => ({
  FilterPanel: () => null,
}));
jest.mock('../../../src/components/home/HomeBackground', () => ({
  HomeBackground: () => null,
}));

const baseParams = {
  destination: 'Bogotá',
  checkIn: '2025-06-01',
  checkOut: '2025-06-05',
  adults: 2,
  children: 0,
  rooms: 1,
  pets: false,
};

const mockAccommodation = {
  id: 1,
  name: 'Hotel Test',
  image: null,
  distanceFromCenter: 1.0,
  stars: 3,
  rating: { score: 8.0, reviewCount: 5 },
  amenities: [],
  hasBreakfast: false,
  price: { perNight: 200000, currency: 'COP' },
};

beforeEach(() => {
  jest.useFakeTimers();
  (searchService.getSearchFilters as jest.Mock).mockResolvedValue({
    amenities: [],
    accommodationTypes: [],
    meals: [],
    stars: [],
  });
  (searchService.getSearchProperties as jest.Mock).mockResolvedValue({
    results: [mockAccommodation],
    totalPages: 1,
  });
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('SearchScreen — accessibility', () => {
  it('renders without errors', () => {
    const { UNSAFE_root } = render(<SearchScreen params={baseParams} _onBack={jest.fn()} />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('filter button has accessibilityRole="button" when results are present', async () => {
    const { getByTestId } = render(<SearchScreen params={baseParams} _onBack={jest.fn()} />);
    await waitFor(() => getByTestId('search-filter-btn'));
    expect(getByTestId('search-filter-btn').props.accessibilityRole).toBe('button');
  });

  it('filter button has a descriptive accessibilityLabel', async () => {
    const { getByTestId } = render(<SearchScreen params={baseParams} _onBack={jest.fn()} />);
    await waitFor(() => getByTestId('search-filter-btn'));
    expect(getByTestId('search-filter-btn').props.accessibilityLabel).toBeTruthy();
  });

  it('search bar button has accessibilityRole="button"', async () => {
    const { getByTestId } = render(<SearchScreen params={baseParams} _onBack={jest.fn()} />);
    await waitFor(() => getByTestId('search-summary-bar'));
    expect(getByTestId('search-summary-bar').props.accessibilityRole).toBe('button');
  });
});
