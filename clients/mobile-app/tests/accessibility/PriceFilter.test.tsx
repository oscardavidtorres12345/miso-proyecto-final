import React from 'react';
import { render } from '@testing-library/react-native';
import { PriceFilter } from '../../src/components/search/PriceFilter';

const baseProps = {
  value: { min: '', max: '' },
  onChange: jest.fn(),
};

describe('PriceFilter — accesibilidad', () => {
  describe('campo precio mínimo', () => {
    it('tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(<PriceFilter {...baseProps} />);
      expect(getByTestId('price-min-input').props.accessibilityLabel).toBeTruthy();
    });

    it('tiene testID para ser referenciado', () => {
      const { getByTestId } = render(<PriceFilter {...baseProps} />);
      expect(getByTestId('price-min-input')).toBeTruthy();
    });
  });

  describe('campo precio máximo', () => {
    it('tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(<PriceFilter {...baseProps} />);
      expect(getByTestId('price-max-input').props.accessibilityLabel).toBeTruthy();
    });

    it('tiene testID para ser referenciado', () => {
      const { getByTestId } = render(<PriceFilter {...baseProps} />);
      expect(getByTestId('price-max-input')).toBeTruthy();
    });
  });
});
