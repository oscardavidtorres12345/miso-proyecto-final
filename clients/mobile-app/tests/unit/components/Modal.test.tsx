import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ConfirmModal } from '../../../src/components/common/Modal';

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Título modal',
    message: 'Mensaje de confirmación',
    cancelLabel: 'No',
    confirmLabel: 'Sí',
    onConfirm: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders title, message and both actions when open', () => {
    const { getByText } = render(<ConfirmModal {...defaultProps} />);
    expect(getByText('Título modal')).toBeTruthy();
    expect(getByText('Mensaje de confirmación')).toBeTruthy();
    expect(getByText('No')).toBeTruthy();
    expect(getByText('Sí')).toBeTruthy();
  });

  it('calls onClose when cancel is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(<ConfirmModal {...defaultProps} onClose={onClose} />);
    fireEvent.press(getByText('No'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm is pressed', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.press(getByText('Sí'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('passes visible false when closed', () => {
    const { UNSAFE_getByType } = render(<ConfirmModal {...defaultProps} isOpen={false} />);
    const { Modal } = require('react-native');
    const modal = UNSAFE_getByType(Modal);
    expect(modal.props.visible).toBe(false);
  });

  it('calls onClose from onRequestClose', () => {
    const onClose = jest.fn();
    const { UNSAFE_getByType } = render(<ConfirmModal {...defaultProps} onClose={onClose} />);
    const { Modal } = require('react-native');
    UNSAFE_getByType(Modal).props.onRequestClose();
    expect(onClose).toHaveBeenCalled();
  });
});
