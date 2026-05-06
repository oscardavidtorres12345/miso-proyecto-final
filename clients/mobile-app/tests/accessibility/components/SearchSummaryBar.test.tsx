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

describe('SearchSummaryBar — accessibility', () => {
  it('has accessibilityRole="button"', () => {
    const { getByTestId } = render(
      <SearchSummaryBar params={baseParams} onEditSearch={jest.fn()} />,
    );
    expect(getByTestId('search-summary-bar').props.accessibilityRole).toBe('button');
  });

  it('has a descriptive accessibilityLabel', () => {
    const { getByTestId } = render(
      <SearchSummaryBar params={baseParams} onEditSearch={jest.fn()} />,
    );
    expect(getByTestId('search-summary-bar').props.accessibilityLabel).toBeTruthy();
  });

  it('has a testID', () => {
    const { getByTestId } = render(
      <SearchSummaryBar params={baseParams} onEditSearch={jest.fn()} />,
    );
    expect(getByTestId('search-summary-bar')).toBeTruthy();
  });
});
