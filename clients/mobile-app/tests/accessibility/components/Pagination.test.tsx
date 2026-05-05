import React from 'react';
import { render } from '@testing-library/react-native';
import { Pagination } from '../../../src/components/search/Pagination';

describe('Pagination — accesibilidad', () => {
  describe('botón anterior', () => {
    it('tiene accessibilityRole="button"', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-prev').props.accessibilityRole).toBe('button');
    });

    it('tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-prev').props.accessibilityLabel).toBeTruthy();
    });

    it('comunica accessibilityState.disabled=true en la primera página', () => {
      const { getByTestId } = render(
        <Pagination currentPage={1} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-prev').props.accessibilityState?.disabled).toBe(true);
    });

    it('comunica accessibilityState.disabled=false cuando no es la primera página', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-prev').props.accessibilityState?.disabled).toBe(false);
    });
  });

  describe('botón siguiente', () => {
    it('tiene accessibilityRole="button"', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-next').props.accessibilityRole).toBe('button');
    });

    it('tiene accessibilityLabel descriptivo', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-next').props.accessibilityLabel).toBeTruthy();
    });

    it('comunica accessibilityState.disabled=true en la última página', () => {
      const { getByTestId } = render(
        <Pagination currentPage={5} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-next').props.accessibilityState?.disabled).toBe(true);
    });

    it('comunica accessibilityState.disabled=false cuando no es la última página', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-next').props.accessibilityState?.disabled).toBe(false);
    });
  });

  describe('botones de página', () => {
    it('cada botón de página tiene accessibilityRole="button"', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-page-1').props.accessibilityRole).toBe('button');
      expect(getByTestId('pagination-page-2').props.accessibilityRole).toBe('button');
    });

    it('cada botón de página tiene accessibilityLabel con su número', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-page-1').props.accessibilityLabel).toBe('Página 1');
      expect(getByTestId('pagination-page-2').props.accessibilityLabel).toBe('Página 2');
    });

    it('la página activa tiene accessibilityState.selected=true', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-page-2').props.accessibilityState?.selected).toBe(true);
    });

    it('las páginas inactivas tienen accessibilityState.selected=false', () => {
      const { getByTestId } = render(
        <Pagination currentPage={2} totalPages={5} onPageChange={jest.fn()} />,
      );
      expect(getByTestId('pagination-page-1').props.accessibilityState?.selected).toBe(false);
    });
  });

  it('no renderiza cuando totalPages <= 1', () => {
    const { UNSAFE_root } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={jest.fn()} />,
    );
    // El componente retorna null, el árbol de renders estará vacío
    expect(UNSAFE_root.children).toHaveLength(0);
  });
});
