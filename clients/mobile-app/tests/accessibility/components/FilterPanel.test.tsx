import React from 'react';
import { render } from '@testing-library/react-native';
import { FilterPanel } from '../../../src/components/search/FilterPanel';

const { __setSafeAreaInsets } = require('react-native-safe-area-context') as {
  __setSafeAreaInsets: (insets: { top: number; right: number; bottom: number; left: number }) => void;
};

beforeEach(() => {
  __setSafeAreaInsets({ top: 0, right: 0, bottom: 0, left: 0 });
});

const baseProps = {
  isOpen: true,
  filters: {
    price: { min: '', max: '' },
    services: [],
    accommodationTypes: [],
    stars: [],
    meals: [],
  },
  options: {
    services: [],
    accommodationTypes: [],
    meals: [],
    stars: [],
  },
  onFiltersChange: jest.fn(),
  onCancel: jest.fn(),
  onApply: jest.fn(),
};

describe('FilterPanel — accessibility', () => {
  describe('cancel button', () => {
    it('has accessibilityRole="button"', () => {
      const { getByTestId } = render(<FilterPanel {...baseProps} />);
      expect(getByTestId('filter-cancel-btn').props.accessibilityRole).toBe('button');
    });

    it('has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(<FilterPanel {...baseProps} />);
      expect(getByTestId('filter-cancel-btn').props.accessibilityLabel).toBeTruthy();
    });

    it('has a testID', () => {
      const { getByTestId } = render(<FilterPanel {...baseProps} />);
      expect(getByTestId('filter-cancel-btn')).toBeTruthy();
    });
  });

  describe('apply button', () => {
    it('has accessibilityRole="button"', () => {
      const { getByTestId } = render(<FilterPanel {...baseProps} />);
      expect(getByTestId('filter-apply-btn').props.accessibilityRole).toBe('button');
    });

    it('has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(<FilterPanel {...baseProps} />);
      expect(getByTestId('filter-apply-btn').props.accessibilityLabel).toBeTruthy();
    });

    it('has a testID', () => {
      const { getByTestId } = render(<FilterPanel {...baseProps} />);
      expect(getByTestId('filter-apply-btn')).toBeTruthy();
    });
  });
});
