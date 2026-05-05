import React from 'react';
import { render } from '@testing-library/react-native';
import { SearchSummaryBar } from '../../../src/components/search/SearchSummaryBar';

const baseParams = {
  destination: 'Bogotá',
  checkIn: '2025-06-01',
  checkOut: '2025-06-05',
  adults: 2,
  children: 0,
  rooms: 1,
  pets: false,
};

describe('SearchSummaryBar — accesibilidad', () => {
  it('tiene accessibilityRole="button"', () => {
    const { getByTestId } = render(
      <SearchSummaryBar params={baseParams} onEditSearch={jest.fn()} />,
    );
    expect(getByTestId('search-summary-bar').props.accessibilityRole).toBe('button');
  });

  it('tiene accessibilityLabel descriptivo', () => {
    const { getByTestId } = render(
      <SearchSummaryBar params={baseParams} onEditSearch={jest.fn()} />,
    );
    expect(getByTestId('search-summary-bar').props.accessibilityLabel).toBeTruthy();
  });

  it('tiene testID para ser referenciado', () => {
    const { getByTestId } = render(
      <SearchSummaryBar params={baseParams} onEditSearch={jest.fn()} />,
    );
    expect(getByTestId('search-summary-bar')).toBeTruthy();
  });
});
