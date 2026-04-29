import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';

import { Pagination } from '../../../src/components/search/Pagination';

describe('Pagination', () => {
  it('renders nothing when totalPages <= 1', () => {
    const { toJSON } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={jest.fn()} />,
    );
    expect(toJSON()).toBeNull();
  });

  it('changes page on number and arrow presses', () => {
    const onPageChange = jest.fn();
    const { getByText, UNSAFE_getAllByType } = render(
      <Pagination currentPage={3} totalPages={8} onPageChange={onPageChange} />,
    );

    fireEvent.press(getByText('2'));
    fireEvent.press(getByText('4'));
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[0]);
    fireEvent.press(touchables[touchables.length - 1]);
    expect(getByText('…')).toBeTruthy();
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(onPageChange).toHaveBeenCalledWith(4);
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('disables previous arrow on first page and next arrow on last page', () => {
    const firstCb = jest.fn();
    const { UNSAFE_getAllByType, rerender } = render(
      <Pagination currentPage={1} totalPages={8} onPageChange={firstCb} />,
    );
    let touchables = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[0]);
    fireEvent.press(touchables[touchables.length - 1]);
    expect(firstCb).toHaveBeenCalledWith(2);

    const lastCb = jest.fn();
    rerender(<Pagination currentPage={8} totalPages={8} onPageChange={lastCb} />);
    touchables = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[0]);
    fireEvent.press(touchables[touchables.length - 1]);
    expect(lastCb).toHaveBeenCalledWith(7);
  });

  it('renders compact page list without ellipsis when total <= 7', () => {
    const { queryByText, getByText } = render(
      <Pagination currentPage={4} totalPages={7} onPageChange={jest.fn()} />,
    );
    expect(queryByText('…')).toBeNull();
    expect(getByText('1')).toBeTruthy();
    expect(getByText('7')).toBeTruthy();
  });
});
