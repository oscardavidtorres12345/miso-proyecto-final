import React from 'react';
import { render } from '@testing-library/react-native';
import { AccommodationDetailScreen } from '../../../src/screens/AccommodationDetailScreen';

jest.mock('../../../src/components/home/HomeBackground', () => ({
  HomeBackground: () => null,
}));

describe('AccommodationDetailScreen — accessibility', () => {
  it('back-to-search button has accessibilityRole="button"', () => {
    const { getByTestId } = render(<AccommodationDetailScreen onBack={jest.fn()} />);
    expect(getByTestId('detail-back-home-btn').props.accessibilityRole).toBe('button');
  });
});
