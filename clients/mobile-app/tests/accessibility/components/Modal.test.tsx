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

describe('ConfirmModal — accesibilidad', () => {
  it('el botón de cancelar tiene accessibilityRole="button"', () => {
    const { getByTestId } = render(<ConfirmModal {...baseProps} />);
    expect(getByTestId('modal-cancel-btn').props.accessibilityRole).toBe('button');
  });

  it('el botón de confirmar tiene accessibilityRole="button"', () => {
    const { getByTestId } = render(<ConfirmModal {...baseProps} />);
    expect(getByTestId('modal-confirm-btn').props.accessibilityRole).toBe('button');
  });

  it('el botón de cancelar tiene accessibilityLabel igual al cancelLabel prop', () => {
    const { getByTestId } = render(<ConfirmModal {...baseProps} />);
    expect(getByTestId('modal-cancel-btn').props.accessibilityLabel).toBe('No, volver');
  });

  it('el botón de confirmar tiene accessibilityLabel igual al confirmLabel prop', () => {
    const { getByTestId } = render(<ConfirmModal {...baseProps} />);
    expect(getByTestId('modal-confirm-btn').props.accessibilityLabel).toBe('Sí, cancelar');
  });

  it('los botones tienen testID para ser referenciados', () => {
    const { getByTestId } = render(<ConfirmModal {...baseProps} />);
    expect(getByTestId('modal-cancel-btn')).toBeTruthy();
    expect(getByTestId('modal-confirm-btn')).toBeTruthy();
  });
});
