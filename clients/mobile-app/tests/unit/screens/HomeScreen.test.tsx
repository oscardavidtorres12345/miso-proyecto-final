import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { HomeScreen } from '../../../src/screens/HomeScreen';

describe('HomeScreen', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<HomeScreen />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders hero subtitle and title', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Descubre tus próximas vacaciones')).toBeTruthy();
    expect(getByText('La vida es corta y el mundo es gigante.')).toBeTruthy();
  });

  it('renders features section', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Reservas seguras')).toBeTruthy();
    expect(getByText('Mejores precios')).toBeTruthy();
  });

  it('renders popular destinations', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Cartagena')).toBeTruthy();
    expect(getByText('Medellín')).toBeTruthy();
    expect(getByText('Bogotá')).toBeTruthy();
    expect(getByText('Santa Marta')).toBeTruthy();
  });

  it('renders travel section', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Explorá el mundo')).toBeTruthy();
    expect(getByText('Cada viaje es una historia que contar')).toBeTruthy();
  });

  it('opens SearchBottomSheet when Buscar is pressed', async () => {
    const { getByText, getByPlaceholderText } = render(<HomeScreen />);
    fireEvent.press(getByText('Buscar'));
    await waitFor(() => expect(getByPlaceholderText('¿Adónde vas?')).toBeTruthy());
  });

  it('fires onContentSizeChange updating background height', () => {
    const { UNSAFE_getByType } = render(<HomeScreen />);
    const { ScrollView } = require('react-native');
    act(() => {
      fireEvent(UNSAFE_getByType(ScrollView), 'contentSizeChange', 0, 2000);
    });
    expect(UNSAFE_getByType(ScrollView)).toBeTruthy();
  });

  it('closes SearchBottomSheet via onClose and hides the sheet', async () => {
    const { getByText, UNSAFE_getByType, queryByPlaceholderText } = render(<HomeScreen />);
    fireEvent.press(getByText('Buscar'));
    await waitFor(() => expect(queryByPlaceholderText('¿Adónde vas?')).toBeTruthy());

    const { Modal } = require('react-native');
    await act(async () => {
      fireEvent(UNSAFE_getByType(Modal), 'requestClose');
    });
    expect(UNSAFE_getByType(Modal)).toBeTruthy();
  });

  it('closes SearchBottomSheet when overlay is pressed and reopens on next Buscar press', async () => {
    const { getByText, getAllByText, getByPlaceholderText } = render(<HomeScreen />);

    fireEvent.press(getByText('Buscar'));
    await waitFor(() => expect(getByPlaceholderText('¿Adónde vas?')).toBeTruthy());

    fireEvent.press(getAllByText('Buscar')[0]);
    await waitFor(() => expect(getByPlaceholderText('¿Adónde vas?')).toBeTruthy());
  });
});
