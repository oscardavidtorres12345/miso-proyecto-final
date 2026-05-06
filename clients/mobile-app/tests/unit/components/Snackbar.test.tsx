import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Snackbar } from '../../../src/components/common/Snackbar';

describe('Snackbar', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('renders the snackbar container', () => {
      const { getByTestId } = render(
        <Snackbar show={false} message="Test" variant="success" onClose={jest.fn()} />
      );
      expect(getByTestId('snackbar')).toBeTruthy();
    });

    it('displays the message when show is true', () => {
      const { getByText } = render(
        <Snackbar show={true} message="Operación exitosa" variant="success" onClose={jest.fn()} />
      );
      expect(getByText('Operación exitosa')).toBeTruthy();
    });

    it('has snackbar-message testID', () => {
      const { getByTestId } = render(
        <Snackbar show={true} message="Test message" variant="success" onClose={jest.fn()} />
      );
      expect(getByTestId('snackbar-message')).toBeTruthy();
    });
  });

  describe('close button', () => {
    it('calls onClose when the close button is pressed', () => {
      const onClose = jest.fn();
      const { getByTestId } = render(
        <Snackbar show={true} message="Error" variant="error" onClose={onClose} />
      );
      fireEvent.press(getByTestId('snackbar-close'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('auto-dismiss', () => {
    it('calls onClose after the duration', async () => {
      jest.useFakeTimers();
      const onClose = jest.fn();
      render(
        <Snackbar show={true} message="Auto" variant="success" onClose={onClose} duration={3000} />
      );

      expect(onClose).not.toHaveBeenCalled();
      jest.advanceTimersByTime(3000);
      expect(onClose).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('uses 4000ms as default duration', async () => {
      jest.useFakeTimers();
      const onClose = jest.fn();
      render(
        <Snackbar show={true} message="Auto" variant="success" onClose={onClose} />
      );

      jest.advanceTimersByTime(3999);
      expect(onClose).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(onClose).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('cancels the timer when show becomes false', () => {
      jest.useFakeTimers();
      const onClose = jest.fn();
      const { rerender } = render(
        <Snackbar show={true} message="Auto" variant="success" onClose={onClose} duration={2000} />
      );

      rerender(
        <Snackbar show={false} message="Auto" variant="success" onClose={onClose} duration={2000} />
      );

      jest.advanceTimersByTime(2000);
      expect(onClose).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('variants', () => {
    it('renders without errors for success variant', () => {
      const { getByTestId } = render(
        <Snackbar show={true} message="Éxito" variant="success" onClose={jest.fn()} />
      );
      expect(getByTestId('snackbar')).toBeTruthy();
    });

    it('renders without errors for error variant', () => {
      const { getByTestId } = render(
        <Snackbar show={true} message="Error" variant="error" onClose={jest.fn()} />
      );
      expect(getByTestId('snackbar')).toBeTruthy();
    });
  });
});
