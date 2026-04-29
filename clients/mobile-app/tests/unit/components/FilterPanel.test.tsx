import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Animated, TextInput } from 'react-native';

import { FilterPanel, type FiltersState } from '../../../src/components/search/FilterPanel';

const filters: FiltersState = {
  price: { min: '', max: '' },
  services: [],
  accommodationTypes: [],
  stars: [],
  meals: [],
};

const options = {
  services: [{ id: 'wifi', label: 'WiFi' }],
  accommodationTypes: [{ id: 'hotel', label: 'Hoteles' }],
  meals: [{ id: 'breakfast', label: 'Desayuno' }],
  stars: [{ id: '4', label: '★★★★' }],
};

describe('FilterPanel', () => {
  it('renders sections and action buttons', () => {
    const { getByText } = render(
      <FilterPanel
        isOpen={true}
        filters={filters}
        options={options}
        onFiltersChange={jest.fn()}
        onCancel={jest.fn()}
        onApply={jest.fn()}
      />,
    );

    expect(getByText('Filtros')).toBeTruthy();
    expect(getByText('Precio')).toBeTruthy();
    expect(getByText('Servicios')).toBeTruthy();
    expect(getByText('Tipo de alojamiento')).toBeTruthy();
    expect(getByText('Alimentación')).toBeTruthy();
    expect(getByText('Estrellas')).toBeTruthy();
    expect(getByText('Cancelar')).toBeTruthy();
    expect(getByText('Aplicar')).toBeTruthy();
  });

  it('calls action callbacks', () => {
    const onCancel = jest.fn();
    const onApply = jest.fn();
    const { getByText } = render(
      <FilterPanel
        isOpen={true}
        filters={filters}
        options={options}
        onFiltersChange={jest.fn()}
        onCancel={onCancel}
        onApply={onApply}
      />,
    );

    fireEvent.press(getByText('Cancelar'));
    fireEvent.press(getByText('Aplicar'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('propagates filter changes from child controls', () => {
    const onFiltersChange = jest.fn();
    const { getByText, UNSAFE_getAllByType } = render(
      <FilterPanel
        isOpen={true}
        filters={filters}
        options={options}
        onFiltersChange={onFiltersChange}
        onCancel={jest.fn()}
        onApply={jest.fn()}
      />,
    );

    const inputs = UNSAFE_getAllByType(TextInput);
    fireEvent.changeText(inputs[0], '100');
    fireEvent.changeText(inputs[1], '500');
    fireEvent.press(getByText('WiFi'));
    fireEvent.press(getByText('Hoteles'));
    fireEvent.press(getByText('Desayuno'));
    fireEvent.press(getByText('★★★★'));

    expect(onFiltersChange).toHaveBeenCalled();
  });

  it('animates when open state changes', () => {
    const start = jest.fn();
    const timingSpy = jest.spyOn(Animated, 'timing').mockReturnValue({ start } as any);

    const { rerender, queryByText } = render(
      <FilterPanel
        isOpen={false}
        filters={filters}
        options={options}
        onFiltersChange={jest.fn()}
        onCancel={jest.fn()}
        onApply={jest.fn()}
      />,
    );

    expect(queryByText('Filtros')).toBeTruthy();
    rerender(
      <FilterPanel
        isOpen={true}
        filters={filters}
        options={options}
        onFiltersChange={jest.fn()}
        onCancel={jest.fn()}
        onApply={jest.fn()}
      />,
    );

    expect(timingSpy).toHaveBeenCalled();
    expect(start).toHaveBeenCalled();
    rerender(
      <FilterPanel
        isOpen={false}
        filters={filters}
        options={options}
        onFiltersChange={jest.fn()}
        onCancel={jest.fn()}
        onApply={jest.fn()}
      />,
    );
    expect(timingSpy).toHaveBeenCalledTimes(2);
    timingSpy.mockRestore();
  });
});
