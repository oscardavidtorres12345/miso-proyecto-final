import React from 'react';
import { render } from '@testing-library/react-native';
import { ConfirmModal } from '../../../src/components/common/Modal';

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  title: 'Confirmar cancelación',
  message: '¿Deseas cancelar esta reserva?',
  cancelLabel: 'No, volver',
  confirmLabel: 'Sí, cancelar',
  onConfirm: jest.fn(),
};

describe('ConfirmModal — accessibility', () => {
  it('cancel button has accessibilityRole="button"', () => {
    const { getByTestId } = render(<ConfirmModal {...baseProps} />);
    expect(getByTestId('modal-cancel-btn').props.accessibilityRole).toBe('button');
  });

  it('confirm button has accessibilityRole="button"', () => {
    const { getByTestId } = render(<ConfirmModal {...baseProps} />);
    expect(getByTestId('modal-confirm-btn').props.accessibilityRole).toBe('button');
  });

  it('cancel button has accessibilityLabel matching the cancelLabel prop', () => {
    const { getByTestId } = render(<ConfirmModal {...baseProps} />);
    expect(getByTestId('modal-cancel-btn').props.accessibilityLabel).toBe('No, volver');
  });

  it('confirm button has accessibilityLabel matching the confirmLabel prop', () => {
    const { getByTestId } = render(<ConfirmModal {...baseProps} />);
    expect(getByTestId('modal-confirm-btn').props.accessibilityLabel).toBe('Sí, cancelar');
  });

  it('buttons have testIDs', () => {
    const { getByTestId } = render(<ConfirmModal {...baseProps} />);
    expect(getByTestId('modal-cancel-btn')).toBeTruthy();
    expect(getByTestId('modal-confirm-btn')).toBeTruthy();
  });
});
