import React from 'react';
import { render } from '@testing-library/react-native';
import { FilterGroup } from '../../../src/components/search/FilterGroup';

const options = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'pool', label: 'Piscina' },
  { id: 'spa', label: 'Spa' },
  { id: 'gym', label: 'Gimnasio' },
  { id: 'ac', label: 'Aire acondicionado' },
  { id: 'kids', label: 'Servicios para niños' },
  { id: 'pets', label: 'Acepta mascotas' },
];

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('FilterGroup — accessibility', () => {
  describe('filter options', () => {
    it('each option has accessibilityRole="checkbox"', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={[]} onChange={jest.fn()} />,
      );
      expect(getByTestId('filter-option-wifi').props.accessibilityRole).toBe('checkbox');
      expect(getByTestId('filter-option-pool').props.accessibilityRole).toBe('checkbox');
    });

    it('each option has accessibilityLabel with its label', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={[]} onChange={jest.fn()} />,
      );
      expect(getByTestId('filter-option-wifi').props.accessibilityLabel).toBe('WiFi');
      expect(getByTestId('filter-option-pool').props.accessibilityLabel).toBe('Piscina');
    });

    it('unselected option has accessibilityState.checked=false', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={[]} onChange={jest.fn()} />,
      );
      expect(getByTestId('filter-option-wifi').props.accessibilityState?.checked).toBe(false);
    });

    it('selected option has accessibilityState.checked=true', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={['wifi']} onChange={jest.fn()} />,
      );
      expect(getByTestId('filter-option-wifi').props.accessibilityState?.checked).toBe(true);
    });

    it('each option has a unique testID based on its id', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={[]} onChange={jest.fn()} />,
      );
      expect(getByTestId('filter-option-wifi')).toBeTruthy();
      expect(getByTestId('filter-option-pool')).toBeTruthy();
    });
  });

  describe('show more / show less button', () => {
    it('show-more button has accessibilityRole="button"', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={[]} onChange={jest.fn()} pageSize={4} />,
      );
      expect(getByTestId('filter-show-more').props.accessibilityRole).toBe('button');
    });

    it('show-more button has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={[]} onChange={jest.fn()} pageSize={4} />,
      );
      expect(getByTestId('filter-show-more').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('search field', () => {
    it('search input has accessibilityLabel when withSearch is true', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={[]} onChange={jest.fn()} withSearch />,
      );
      expect(getByTestId('filter-group-search-input').props.accessibilityLabel).toBeTruthy();
    });

    it('search input has a testID', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={[]} onChange={jest.fn()} withSearch />,
      );
      expect(getByTestId('filter-group-search-input')).toBeTruthy();
    });
  });
});
