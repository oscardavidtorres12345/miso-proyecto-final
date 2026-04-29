import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { SearchSummaryBar } from '../../../src/components/search/SearchSummaryBar';

describe('SearchSummaryBar', () => {
  it('renders destination and metadata', () => {
    const onEditSearch = jest.fn();
    const { getByText } = render(
      <SearchSummaryBar
        params={{
          destination: 'Cartagena',
          checkIn: '2025-12-01',
          checkOut: '2025-12-05',
          adults: 2,
          children: 0,
          rooms: 1,
          pets: false,
        }}
        onEditSearch={onEditSearch}
      />,
    );

    expect(getByText('Cartagena')).toBeTruthy();
    expect(getByText(/dic/)).toBeTruthy();
    expect(getByText(/2 huéspedes/)).toBeTruthy();
  });

  it('uses fallback texts and triggers edit callback', () => {
    const onEditSearch = jest.fn();
    const { getByText } = render(
      <SearchSummaryBar
        params={{
          destination: '',
          checkIn: '',
          checkOut: '',
          adults: 1,
          children: 0,
          rooms: 1,
          pets: false,
        }}
        onEditSearch={onEditSearch}
      />,
    );

    fireEvent.press(getByText('Destino'));
    expect(getByText('Agrega fechas · 1 huésped')).toBeTruthy();
    expect(onEditSearch).toHaveBeenCalledTimes(1);
  });
});
