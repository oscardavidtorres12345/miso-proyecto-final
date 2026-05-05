import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BarChart from '@/components/BarChart'
import { renderWithProviders } from '../renderWithProviders'

const DATA = [
  { period: '2026-01', value: 12 },
  { period: '2026-02', value: 18 },
  { period: '2026-03', value: 7 },
]

describe('BarChart', () => {
  it('renderiza el SVG', () => {
    const { container } = renderWithProviders(<BarChart data={DATA} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renderiza el label del gráfico', () => {
    renderWithProviders(<BarChart data={DATA} label="Reservas por período" />)
    expect(screen.getByText('Reservas por período')).toBeInTheDocument()
  })

  it('renderiza una barra por cada dato', () => {
    const { container } = renderWithProviders(<BarChart data={DATA} />)
    const rects = container.querySelectorAll('rect')
    expect(rects.length).toBe(DATA.length)
  })

  it('muestra noDataLabel cuando data está vacío', () => {
    renderWithProviders(<BarChart data={[]} noDataLabel="Sin datos" />)
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
  })

  it('no renderiza barras cuando data está vacío', () => {
    const { container } = renderWithProviders(<BarChart data={[]} />)
    expect(container.querySelectorAll('rect')).toHaveLength(0)
  })

  it('trunca periodos largos a 7 caracteres en el eje X', () => {
    const { container } = renderWithProviders(
      <BarChart data={[{ period: '2026-01-15', value: 5 }]} />,
    )
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent)
    expect(texts).toContain('2026-01')
  })
})
