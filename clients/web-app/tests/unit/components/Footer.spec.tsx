import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Footer from '@/components/Footer'

describe('Footer', () => {
  it('renders the footer text', () => {
    render(<Footer />)
    expect(screen.getByText('Hecho con amor 💚')).toBeInTheDocument()
  })

  it('renders a footer element', () => {
    render(<Footer />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
