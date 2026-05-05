import React from 'react';
import { render } from '@testing-library/react-native';
import { FilterGroup } from '../../src/components/search/FilterGroup';

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

describe('FilterGroup — accesibilidad', () => {
  describe('opciones de filtro', () => {
    it('cada opción tiene accessibilityRole="checkbox"', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={[]} onChange={jest.fn()} />,
      );
      expect(getByTestId('filter-option-wifi').props.accessibilityRole).toBe('checkbox');
      expect(getByTestId('filter-option-pool').props.accessibilityRole).toBe('checkbox');
    });

    it('cada opción tiene accessibilityLabel con su etiqueta', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={[]} onChange={jest.fn()} />,
      );
      expect(getByTestId('filter-option-wifi').props.accessibilityLabel).toBe('WiFi');
      expect(getByTestId('filter-option-pool').props.accessibilityLabel).toBe('Piscina');
    });

    it('opción no seleccionada tiene accessibilityState.checked=false', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={[]} onChange={jest.fn()} />,
      );
      expect(getByTestId('filter-option-wifi').props.accessibilityState?.checked).toBe(false);
    });

    it('opción seleccionada tiene accessibilityState.checked=true', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={['wifi']} onChange={jest.fn()} />,
      );
      expect(getByTestId('filter-option-wifi').props.accessibilityState?.checked).toBe(true);
    });

    it('cada opción tiene testID único basado en su id', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={[]} onChange={jest.fn()} />,
      );
      expect(getByTestId('filter-option-wifi')).toBeTruthy();
      expect(getByTestId('filter-option-pool')).toBeTruthy();
    });
  });

  describe('botón ver más / ver menos', () => {
    it('el botón ver más tiene accessibilityRole="button"', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={[]} onChange={jest.fn()} pageSize={4} />,
      );
      expect(getByTestId('filter-show-more').props.accessibilityRole).toBe('button');
    });

    it('el botón ver más tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={[]} onChange={jest.fn()} pageSize={4} />,
      );
      expect(getByTestId('filter-show-more').props.accessibilityLabel).toBeTruthy();
    });
  });

  describe('campo de búsqueda', () => {
    it('el input de búsqueda tiene accessibilityLabel cuando withSearch es true', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={[]} onChange={jest.fn()} withSearch />,
      );
      expect(getByTestId('filter-group-search-input').props.accessibilityLabel).toBeTruthy();
    });

    it('el input de búsqueda tiene testID', () => {
      const { getByTestId } = render(
        <FilterGroup title="Servicios" options={options} selected={[]} onChange={jest.fn()} withSearch />,
      );
      expect(getByTestId('filter-group-search-input')).toBeTruthy();
    });
  });
});
