import React from 'react';
import { render } from '@testing-library/react-native';
import { PriceFilter } from '../../../src/components/search/PriceFilter';

const baseProps = {
  value: { min: '', max: '' },
  onChange: jest.fn(),
};

describe('PriceFilter — accessibility', () => {
  describe('minimum price field', () => {
    it('has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(<PriceFilter {...baseProps} />);
      expect(getByTestId('price-min-input').props.accessibilityLabel).toBeTruthy();
    });

    it('has a testID', () => {
      const { getByTestId } = render(<PriceFilter {...baseProps} />);
      expect(getByTestId('price-min-input')).toBeTruthy();
    });
  });

  describe('maximum price field', () => {
    it('has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(<PriceFilter {...baseProps} />);
      expect(getByTestId('price-max-input').props.accessibilityLabel).toBeTruthy();
    });

    it('has a testID', () => {
      const { getByTestId } = render(<PriceFilter {...baseProps} />);
      expect(getByTestId('price-max-input')).toBeTruthy();
    });
  });
});
