import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { SearchScreen } from '../../../src/screens/SearchScreen';
import * as searchService from '../../../src/services/searchService';

jest.mock('../../../src/components/search/AccommodationCard', () => ({
  AccommodationCard: ({ accommodation }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text>{`card-${accommodation.id}`}</Text>;
  },
}));

jest.mock('../../../src/components/search/SearchSummaryBar', () => ({
  SearchSummaryBar: ({ onEditSearch }: any) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID="summary-edit" onPress={onEditSearch}>
        <Text>summary-edit</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('../../../src/components/search/FilterPanel', () => ({
  FilterPanel: ({ isOpen, options, onFiltersChange, onApply, onCancel }: any) =>
    isOpen
      ? (() => {
          const React = require('react');
          const { TouchableOpacity, Text } = require('react-native');
          return (
            <>
              <Text>{`service-label:${options.services?.[0]?.label ?? ''}`}</Text>
              <Text>{`accommodation-label:${options.accommodationTypes?.[0]?.label ?? ''}`}</Text>
              <Text>{`meal-label:${options.meals?.[0]?.label ?? ''}`}</Text>
              <Text>{`star-label:${options.stars?.[0]?.label ?? ''}`}</Text>
              <TouchableOpacity testID="panel-patch" onPress={() => onFiltersChange({ services: ['wifi'] })}>
                <Text>patch</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="panel-price"
                onPress={() => onFiltersChange({ price: { min: '100', max: '900' } })}
              >
                <Text>price</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="panel-apply" onPress={onApply}>
                <Text>apply</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="panel-cancel" onPress={onCancel}>
                <Text>cancel</Text>
              </TouchableOpacity>
            </>
          );
        })()
      : null,
}));

jest.mock('../../../src/components/search/SearchBottomSheet', () => ({
  SearchBottomSheet: ({
    isOpen,
    onSearch,
    onClose,
    initialDestination,
    initialCheckIn,
    initialCheckOut,
    initialGuests,
  }: any) =>
    isOpen
      ? (() => {
          const React = require('react');
          const { TouchableOpacity, Text } = require('react-native');
          return (
            <>
              <Text>{`sheet-initial-${initialDestination}-${initialCheckIn}-${initialCheckOut}-${initialGuests?.adults}`}</Text>
              <TouchableOpacity
                testID="sheet-search"
                onPress={() =>
                  onSearch({
                    destination: 'Bogota',
                    checkIn: '2025-12-10',
                    checkOut: '2025-12-12',
                    adults: 2,
                    children: 0,
                    rooms: 1,
                    pets: false,
                  })
                }
              >
                <Text>search</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="sheet-close" onPress={onClose}>
                <Text>close</Text>
              </TouchableOpacity>
            </>
          );
        })()
      : null,
}));

jest.mock('../../../src/components/search/Pagination', () => ({
  Pagination: ({ onPageChange }: any) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID="next-page" onPress={() => onPageChange(2)}>
        <Text>next</Text>
      </TouchableOpacity>
    );
  },
}));

describe('SearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads filters/properties and renders empty state', async () => {
    jest.spyOn(searchService, 'getSearchFilters').mockResolvedValue({
      amenities: [],
      accommodationTypes: [],
      meals: [],
      stars: [],
    } as any);
    jest.spyOn(searchService, 'getSearchProperties').mockResolvedValue({
      results: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });

    const { getByText } = render(
      <SearchScreen
        params={{
          destination: 'Cartagena',
          checkIn: '2025-12-01',
          checkOut: '2025-12-05',
          adults: 2,
          children: 0,
          rooms: 1,
          pets: false,
        }}
        _onBack={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(searchService.getSearchFilters).toHaveBeenCalledTimes(1);
      expect(searchService.getSearchProperties).toHaveBeenCalledTimes(1);
    });
    expect(getByText('Ups, parece que no hay resultados por mostrar :( Intenta de nuevo.')).toBeTruthy();
  });

  it('supports filter apply + clear and page change flow', async () => {
    jest.spyOn(searchService, 'getSearchFilters').mockResolvedValue({
      amenities: [{ id: 'wifi', name: 'Wifi' }],
      accommodationTypes: [],
      meals: [],
      stars: [],
    } as any);
    jest.spyOn(searchService, 'getSearchProperties').mockResolvedValue({
      results: [{ id: 1 }],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 2,
    } as any);

    const { getByText, getByTestId } = render(
      <SearchScreen
        params={{
          destination: 'Cartagena',
          checkIn: '2025-12-01',
          checkOut: '2025-12-05',
          adults: 2,
          children: 0,
          rooms: 1,
          pets: false,
        }}
        _onBack={jest.fn()}
      />,
    );

    await waitFor(() => getByText('Filtros'));
    fireEvent.press(getByText('Filtros'));
    fireEvent.press(getByTestId('panel-patch'));
    fireEvent.press(getByTestId('panel-apply'));
    await waitFor(() => getByText('Limpiar filtros'));
    fireEvent.press(getByText('Limpiar filtros'));

    await waitFor(() => {
      expect(searchService.getSearchProperties).toHaveBeenCalledTimes(3);
    });
  });

  it('builds translated/fallback filter options and renders star labels', async () => {
    jest.spyOn(searchService, 'getSearchFilters').mockResolvedValue({
      amenities: [{ id: 'WIFI', name: 'WiFi backend' }],
      accommodationTypes: [{ id: 'UNKNOWN_TYPE', name: 'Tipo backend' }],
      meals: [{ id: 'breakfast', name: 'Desayuno backend' }],
      stars: [4],
    } as any);
    jest.spyOn(searchService, 'getSearchProperties').mockResolvedValue({
      results: [{ id: 1 }],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    } as any);

    const { getByText } = render(
      <SearchScreen
        params={{
          destination: 'Bogota',
          checkIn: '2025-12-01',
          checkOut: '2025-12-05',
          adults: 2,
          children: 0,
          rooms: 1,
          pets: false,
        }}
        _onBack={jest.fn()}
      />,
    );

    await waitFor(() => getByText('Filtros'));
    fireEvent.press(getByText('Filtros'));
    expect(getByText('service-label:WiFi gratuito')).toBeTruthy();
    expect(getByText('accommodation-label:Tipo backend')).toBeTruthy();
    expect(getByText('meal-label:Desayuno')).toBeTruthy();
    expect(getByText('star-label:★★★★')).toBeTruthy();
  });

  it('covers api.services source and non-numeric star labels', async () => {
    jest.spyOn(searchService, 'getSearchFilters').mockResolvedValue({
      services: [{ id: 'SPA', name: 'Spa backend' }],
      accommodationTypes: [],
      meals: [],
      stars: [{ id: 'not-a-number' }],
    } as any);
    jest.spyOn(searchService, 'getSearchProperties').mockResolvedValue({
      results: [{ id: 1 }],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    } as any);

    const { getByText } = render(
      <SearchScreen
        params={{
          destination: 'Bogota',
          checkIn: '2025-12-01',
          checkOut: '2025-12-01',
          adults: 2,
          children: 0,
          rooms: 1,
          pets: false,
        }}
        _onBack={jest.fn()}
      />,
    );

    await waitFor(() => getByText('Filtros'));
    fireEvent.press(getByText('Filtros'));
    expect(getByText('service-label:Spa')).toBeTruthy();
    expect(getByText('star-label:')).toBeTruthy();
  });

  it('handles errors for filters and properties requests', async () => {
    jest.spyOn(searchService, 'getSearchFilters').mockRejectedValue(new Error('filters error'));
    jest.spyOn(searchService, 'getSearchProperties').mockRejectedValue(new Error('properties error'));

    const { getByText } = render(
      <SearchScreen
        params={{
          destination: 'Bogota',
          checkIn: '2025-12-01',
          checkOut: '2025-12-05',
          adults: 2,
          children: 0,
          rooms: 1,
          pets: false,
        }}
        _onBack={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(searchService.getSearchFilters).toHaveBeenCalled();
      expect(searchService.getSearchProperties).toHaveBeenCalled();
    });
    expect(getByText('Ups, parece que no hay resultados por mostrar :( Intenta de nuevo.')).toBeTruthy();
  });

  it('debounces price filters before requesting with priceMin/priceMax', async () => {
    jest.useFakeTimers();

    jest.spyOn(searchService, 'getSearchFilters').mockResolvedValue({
      amenities: [{ id: 'wifi', name: 'WiFi' }],
      accommodationTypes: [],
      meals: [],
      stars: [],
    } as any);
    const propertiesSpy = jest.spyOn(searchService, 'getSearchProperties').mockResolvedValue({
      results: [{ id: 1 }],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    } as any);

    const { getByText, getByTestId } = render(
      <SearchScreen
        params={{
          destination: 'Bogota',
          checkIn: '2025-12-01',
          checkOut: '2025-12-05',
          adults: 2,
          children: 0,
          rooms: 1,
          pets: false,
        }}
        _onBack={jest.fn()}
      />,
    );

    await waitFor(() => getByText('Filtros'));
    fireEvent.press(getByText('Filtros'));
    fireEvent.press(getByTestId('panel-price'));
    fireEvent.press(getByTestId('panel-apply'));

    act(() => { jest.advanceTimersByTime(2001); });

    await waitFor(() => {
      expect(propertiesSpy).toHaveBeenLastCalledWith(expect.objectContaining({ priceMin: 100, priceMax: 900 }));
    });

    jest.runAllTimers();
    jest.useRealTimers();
  });

  it('cancels filter edits without applying draft values', async () => {
    jest.spyOn(searchService, 'getSearchFilters').mockResolvedValue({
      amenities: [{ id: 'wifi', name: 'WiFi' }],
      accommodationTypes: [],
      meals: [],
      stars: [],
    } as any);
    jest.spyOn(searchService, 'getSearchProperties').mockResolvedValue({
      results: [{ id: 1 }],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    } as any);

    const { getByText, getByTestId, queryByText } = render(
      <SearchScreen
        params={{
          destination: 'Bogota',
          checkIn: '2025-12-01',
          checkOut: '2025-12-05',
          adults: 2,
          children: 0,
          rooms: 1,
          pets: false,
        }}
        _onBack={jest.fn()}
      />,
    );

    await waitFor(() => getByText('Filtros'));
    fireEvent.press(getByText('Filtros'));
    fireEvent.press(getByTestId('panel-patch'));
    fireEvent.press(getByTestId('panel-cancel'));

    await waitFor(() => {
      expect(queryByText('Limpiar filtros')).toBeNull();
    });
  });

  it('opens edit sheet, updates committed search, and triggers pagination/page callbacks', async () => {
    jest.spyOn(searchService, 'getSearchFilters').mockResolvedValue({
      amenities: [{ id: 'wifi', name: 'WiFi' }],
      accommodationTypes: [],
      meals: [],
      stars: [],
    } as any);
    const propertiesSpy = jest.spyOn(searchService, 'getSearchProperties').mockResolvedValue({
      results: [{ id: 1 }],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 2,
    } as any);

    const { getByTestId, getByText, UNSAFE_getByType } = render(
      <SearchScreen
        params={{
          destination: 'Cartagena',
          checkIn: '2025-12-01',
          checkOut: '2025-12-05',
          adults: 2,
          children: 0,
          rooms: 1,
          pets: false,
        }}
        _onBack={jest.fn()}
      />,
    );

    await waitFor(() => getByText('Filtros'));
    fireEvent.press(getByTestId('summary-edit'));
    expect(getByText('sheet-initial-Cartagena-2025-12-01-2025-12-05-2')).toBeTruthy();

    fireEvent.press(getByTestId('sheet-close'));
    await waitFor(() => {
      expect(() => getByTestId('sheet-search')).toThrow();
    });

    fireEvent.press(getByTestId('summary-edit'));
    fireEvent.press(getByTestId('sheet-search'));
    await waitFor(() => {
      expect(propertiesSpy).toHaveBeenLastCalledWith(expect.objectContaining({ destination: 'Bogota', page: 1 }));
    });

    fireEvent.press(getByTestId('next-page'));
    await waitFor(() => {
      expect(propertiesSpy).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    });

    const list = UNSAFE_getByType(FlatList as any);
    const separator = list.props.ItemSeparatorComponent();
    expect(separator.type).toBe(View);
    act(() => {
      list.props.onContentSizeChange(0, 500);
    });
  });

  it('cleans debounced timer on unmount and clamps current page to total pages', async () => {
    jest.spyOn(searchService, 'getSearchFilters').mockResolvedValue({
      amenities: [{ id: 'wifi', name: 'WiFi' }],
      accommodationTypes: [],
      meals: [],
      stars: [],
    } as any);
    const propertiesSpy = jest.spyOn(searchService, 'getSearchProperties')
      .mockResolvedValueOnce({ results: [{ id: 1 }], total: 1, page: 1, pageSize: 10, totalPages: 2 } as any)
      .mockResolvedValueOnce({ results: [{ id: 1 }], total: 1, page: 2, pageSize: 10, totalPages: 1 } as any);

    const { getByText, getByTestId, unmount } = render(
      <SearchScreen
        params={{
          destination: 'Bogota',
          checkIn: '2025-12-01',
          checkOut: '2025-12-05',
          adults: 2,
          children: 0,
          rooms: 1,
          pets: false,
        }}
        _onBack={jest.fn()}
      />,
    );

    await waitFor(() => getByText('Filtros'));
    fireEvent.press(getByTestId('next-page'));
    await waitFor(() => {
      expect(propertiesSpy).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });

    fireEvent.press(getByText('Filtros'));
    fireEvent.press(getByTestId('panel-price'));
    fireEvent.press(getByTestId('panel-apply'));
    unmount();
  });

  it('applies empty api filters on request race/cancellation paths', async () => {
    let resolveFiltersA: any;
    const filtersPromiseA = new Promise((resolve) => {
      resolveFiltersA = resolve;
    });
    jest
      .spyOn(searchService, 'getSearchFilters')
      .mockReturnValueOnce(filtersPromiseA as any)
      .mockResolvedValueOnce({
        amenities: [{ id: 'wifi', name: 'WiFi' }],
        accommodationTypes: [],
        meals: [],
        stars: [],
      } as any);

    jest.spyOn(searchService, 'getSearchProperties').mockResolvedValue({
      results: [{ id: 1 }],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    } as any);

    const { getByTestId, getByText } = render(
      <SearchScreen
        params={{
          destination: 'Bogota',
          checkIn: '2025-12-01',
          checkOut: '2025-12-05',
          adults: 2,
          children: 0,
          rooms: 1,
          pets: false,
        }}
        _onBack={jest.fn()}
      />,
    );

    await waitFor(() => getByText('Filtros'));
    fireEvent.press(getByTestId('summary-edit'));
    fireEvent.press(getByTestId('sheet-search'));

    resolveFiltersA({
      amenities: [{ id: 'pool', name: 'Piscina' }],
      accommodationTypes: [],
      meals: [],
      stars: [],
    });

    await waitFor(() => {
      expect(searchService.getSearchFilters).toHaveBeenCalledTimes(2);
    });
  });

  it('covers debounce cleanup and sequence guards for properties requests', async () => {
    let resolveFirst: any;
    const firstProps = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const propsSpy = jest
      .spyOn(searchService, 'getSearchProperties')
      .mockReturnValueOnce(firstProps as any)
      .mockResolvedValueOnce({
        results: [{ id: 2 }],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      } as any);
    jest.spyOn(searchService, 'getSearchFilters').mockResolvedValue({
      amenities: [{ id: 'wifi', name: 'WiFi' }],
      accommodationTypes: [],
      meals: [],
      stars: [],
    } as any);

    const { getByText, getByTestId, unmount } = render(
      <SearchScreen
        params={{
          destination: 'Bogota',
          checkIn: '2025-12-01',
          checkOut: '2025-12-05',
          adults: 2,
          children: 0,
          rooms: 1,
          pets: false,
        }}
        _onBack={jest.fn()}
      />,
    );

    await act(async () => {
      resolveFirst({
        results: [{ id: 1 }],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 2,
      });
    });

    await waitFor(() => getByText('Filtros'));
    fireEvent.press(getByText('Filtros'));
    fireEvent.press(getByTestId('panel-price'));
    fireEvent.press(getByTestId('panel-apply'));
    fireEvent.press(getByText('Filtros'));
    fireEvent.press(getByTestId('panel-price'));
    fireEvent.press(getByTestId('panel-apply'));

    await waitFor(() => {
      expect(propsSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
    unmount();
  });
});
