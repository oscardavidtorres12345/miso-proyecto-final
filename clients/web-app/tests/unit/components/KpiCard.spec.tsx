import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import KpiCard from '@/components/KpiCard'
import { renderWithProviders } from '../renderWithProviders'

describe('KpiCard', () => {
  it('renderiza el label y el valor numérico', () => {
    renderWithProviders(<KpiCard label="Total de reservas" value={42} />)
    expect(screen.getByText('Total de reservas')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renderiza un valor en formato string', () => {
    renderWithProviders(<KpiCard label="Ingresos" value="$1.500.000" />)
    expect(screen.getByText('$1.500.000')).toBeInTheDocument()
  })

  it('renderiza el ícono cuando se pasa como prop', () => {
    renderWithProviders(
      <KpiCard label="Huéspedes" value={5} icon={<svg data-testid="icon" />} />,
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('no renderiza contenedor de ícono cuando no se pasa', () => {
    const { container } = renderWithProviders(<KpiCard label="Test" value={0} />)
    expect(container.querySelector('.rounded-full')).not.toBeInTheDocument()
  })
})
