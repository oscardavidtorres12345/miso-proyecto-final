import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { PriceFilter } from '../../../src/components/search/PriceFilter';

describe('PriceFilter', () => {
  it('renders labels and formats values', () => {
    const onChange = jest.fn();
    const { getByText, getAllByDisplayValue } = render(
      <PriceFilter value={{ min: '30000', max: '120000' }} onChange={onChange} />,
    );

    expect(getByText('Precio')).toBeTruthy();
    expect(getByText('Mín.')).toBeTruthy();
    expect(getByText('Máx.')).toBeTruthy();
    expect(getAllByDisplayValue('30.000').length).toBeGreaterThan(0);
    expect(getAllByDisplayValue('120.000').length).toBeGreaterThan(0);
  });

  it('keeps only digits on input change', () => {
    const onChange = jest.fn();
    const { getAllByPlaceholderText } = render(
      <PriceFilter value={{ min: '', max: '' }} onChange={onChange} />,
    );

    const [minInput, maxInput] = getAllByPlaceholderText('0');
    fireEvent.changeText(minInput, '3a.000');
    fireEvent.changeText(maxInput, '90x00');

    expect(onChange).toHaveBeenNthCalledWith(1, { min: '3000', max: '' });
    expect(onChange).toHaveBeenNthCalledWith(2, { min: '', max: '9000' });
  });

  it('keeps raw value when Number is not finite', () => {
    const onChange = jest.fn();
    const { getByDisplayValue } = render(
      <PriceFilter value={{ min: '1e309', max: '' }} onChange={onChange} />,
    );

    expect(getByDisplayValue('1e309')).toBeTruthy();
  });
});
