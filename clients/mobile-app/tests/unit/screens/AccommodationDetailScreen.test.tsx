import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import esCO from '../../../src/i18n/locales/es-CO';
import { AccommodationDetailScreen } from '../../../src/screens/AccommodationDetailScreen';

jest.mock('../../../src/components/home/HomeBackground', () => ({
  HomeBackground: () => null,
}));

describe('AccommodationDetailScreen', () => {
  it('renders under-construction title', () => {
    const { getByText } = render(<AccommodationDetailScreen onBack={jest.fn()} />);
    expect(getByText(esCO.accommodationDetail.underConstructionTitle)).toBeTruthy();
  });

  it('renders under-construction subtitle', () => {
    const { getByText } = render(<AccommodationDetailScreen onBack={jest.fn()} />);
    expect(getByText(esCO.accommodationDetail.underConstructionSubtitle)).toBeTruthy();
  });

  it('renders back-to-search button', () => {
    const { getByTestId } = render(<AccommodationDetailScreen onBack={jest.fn()} />);
    expect(getByTestId('detail-back-home-btn')).toBeTruthy();
  });

  it('calls onBack when back-to-search button is pressed', () => {
    const onBack = jest.fn();
    const { getByTestId } = render(<AccommodationDetailScreen onBack={onBack} />);
    fireEvent.press(getByTestId('detail-back-home-btn'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
