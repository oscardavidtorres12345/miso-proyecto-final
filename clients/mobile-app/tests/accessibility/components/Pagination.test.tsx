import React from 'react';
import { render } from '@testing-library/react-native';
import { Pagination } from '../../../src/components/search/Pagination';

describe('Pagination — accessibility', () => {
  describe('previous button', () => {
    it('has accessibilityRole="button"', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-prev').props.accessibilityRole).toBe('button');
    });

    it('has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-prev').props.accessibilityLabel).toBeTruthy();
    });

    it('reports accessibilityState.disabled=true on the first page', () => {
      const { getByTestId } = render(
        <Pagination currentPage={1} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-prev').props.accessibilityState?.disabled).toBe(true);
    });

    it('reports accessibilityState.disabled=false when not on the first page', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-prev').props.accessibilityState?.disabled).toBe(false);
    });
  });

  describe('next button', () => {
    it('has accessibilityRole="button"', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-next').props.accessibilityRole).toBe('button');
    });

    it('has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-next').props.accessibilityLabel).toBeTruthy();
    });

    it('reports accessibilityState.disabled=true on the last page', () => {
      const { getByTestId } = render(
        <Pagination currentPage={5} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-next').props.accessibilityState?.disabled).toBe(true);
    });

    it('reports accessibilityState.disabled=false when not on the last page', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-next').props.accessibilityState?.disabled).toBe(false);
    });
  });

  describe('page buttons', () => {
    it('each page button has accessibilityRole="button"', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-page-1').props.accessibilityRole).toBe('button');
      expect(getByTestId('pagination-page-2').props.accessibilityRole).toBe('button');
    });

    it('each page button has accessibilityLabel with its number', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-page-1').props.accessibilityLabel).toBeTruthy();
      expect(getByTestId('pagination-page-2').props.accessibilityLabel).toBeTruthy();
    });

    it('active page has accessibilityState.selected=true', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-page-2').props.accessibilityState?.selected).toBe(true);
    });

    it('inactive pages have accessibilityState.selected=false', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-page-1').props.accessibilityState?.selected).toBe(false);
    });
  });

  it('renders nothing when totalPages <= 1', () => {
    const { UNSAFE_root } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={jest.fn()} />,
    );
    expect(UNSAFE_root.children).toHaveLength(0);
  });
});
