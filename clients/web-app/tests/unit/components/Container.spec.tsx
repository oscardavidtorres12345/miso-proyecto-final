import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Container from '@/components/Container'

describe('Container', () => {
  it('renders children inside page-container', () => {
    render(
      <Container>
        <span>inner</span>
      </Container>
    )
    const wrapper = screen.getByText('inner').parentElement
    expect(wrapper).toHaveClass('page-container')
  })

  it('merges className', () => {
    const { container } = render(
      <Container className="extra">
        <span>x</span>
      </Container>
    )
    expect(container.firstChild).toHaveClass('page-container', 'extra')
  })
})
