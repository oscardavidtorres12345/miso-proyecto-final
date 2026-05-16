import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HorizontalBarChart from '@/components/HorizontalBarChart'
import { renderWithProviders } from '../renderWithProviders'

const DATA = [
  { label: 'Suite Junior', value: 25 },
  { label: 'Estándar', value: 17 },
  { label: 'Familiar', value: 9 },
]

describe('HorizontalBarChart', () => {
  it('renderiza el SVG', () => {
    const { container } = renderWithProviders(<HorizontalBarChart data={DATA} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renderiza el label del gráfico', () => {
    renderWithProviders(<HorizontalBarChart data={DATA} label="Ranking" />)
    expect(screen.getByText('Ranking')).toBeInTheDocument()
  })

  it('renderiza una barra por cada dato', () => {
    const { container } = renderWithProviders(<HorizontalBarChart data={DATA} />)
    expect(container.querySelectorAll('[data-testid="bar-rect"]')).toHaveLength(DATA.length)
  })

  it('muestra los labels de cada ítem', () => {
    renderWithProviders(<HorizontalBarChart data={DATA} />)
    expect(screen.getByText(/Suite Junior/)).toBeInTheDocument()
    expect(screen.getByText(/Estándar/)).toBeInTheDocument()
  })

  it('muestra noDataLabel cuando data está vacío', () => {
    renderWithProviders(<HorizontalBarChart data={[]} noDataLabel="Sin datos" />)
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
  })

  it('no renderiza barras cuando data está vacío', () => {
    const { container } = renderWithProviders(<HorizontalBarChart data={[]} />)
    expect(container.querySelectorAll('rect')).toHaveLength(0)
  })

  it('hace wrap de labels de más de 22 caracteres en múltiples líneas', () => {
    const longLabel = 'Suite Presidencial Deluxe Premium'
    const { container } = renderWithProviders(
      <HorizontalBarChart data={[{ label: longLabel, value: 5 }]} />,
    )
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent)
    const labelParts = texts.filter(t => t && longLabel.includes(t) && t.length > 0)
    expect(labelParts.length).toBeGreaterThan(1)
  })

  it('aplica el color pasado como prop', () => {
    const { container } = renderWithProviders(
      <HorizontalBarChart data={DATA} color="#213500" />,
    )
    const rect = container.querySelector('[data-testid="bar-rect"]')
    expect(rect?.getAttribute('fill')).toBe('#213500')
  })
})
