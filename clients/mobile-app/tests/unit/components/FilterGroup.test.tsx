import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

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

describe('FilterGroup', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('toggles options', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <FilterGroup
        title="Servicios"
        options={options}
        selected={[]}
        onChange={onChange}
      />,
    );

    fireEvent.press(getByText('WiFi'));
    expect(onChange).toHaveBeenCalledWith(['wifi']);
  });

  it('removes option when already selected', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <FilterGroup
        title="Servicios"
        options={options}
        selected={['wifi']}
        onChange={onChange}
      />,
    );

    fireEvent.press(getByText('WiFi'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows search and pagination controls', () => {
    const { getByPlaceholderText, getByText } = render(
      <FilterGroup
        title="Servicios"
        options={options}
        selected={[]}
        onChange={jest.fn()}
        withSearch
      />,
    );

    expect(getByPlaceholderText('Busca por servicios')).toBeTruthy();
    expect(getByText('Ver más')).toBeTruthy();
    fireEvent.press(getByText('Ver más'));
    expect(getByText('Ver menos')).toBeTruthy();
    fireEvent.press(getByText('Ver menos'));
  });

  it('filters options by search query after debounce', () => {
    const { getByPlaceholderText, queryByText, getByText } = render(
      <FilterGroup
        title="Servicios"
        options={options}
        selected={[]}
        onChange={jest.fn()}
        withSearch
      />,
    );

    fireEvent.changeText(getByPlaceholderText('Busca por servicios'), 'pisc');
    act(() => {
      jest.advanceTimersByTime(650);
    });

    expect(getByText('Piscina')).toBeTruthy();
    expect(queryByText('Servicios para niños')).toBeNull();
  });

  it('cleans debounce timer on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { getByPlaceholderText, unmount } = render(
      <FilterGroup
        title="Servicios"
        options={options}
        selected={[]}
        onChange={jest.fn()}
        withSearch
      />,
    );

    fireEvent.changeText(getByPlaceholderText('Busca por servicios'), 'wifi');
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
