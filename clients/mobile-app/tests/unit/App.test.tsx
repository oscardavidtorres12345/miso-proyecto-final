import React from 'react';
import { act, render } from '@testing-library/react-native';

import App from '../../App';

describe('App', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('shows splash screen first and then renders home screen', () => {
    const { getByTestId, queryByTestId, getByText, unmount } = render(<App />);

    expect(getByTestId('app-root')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(queryByTestId('app-root')).toBeNull();
    expect(getByText('Descubre tus próximas vacaciones')).toBeTruthy();

    unmount();
  });
});
