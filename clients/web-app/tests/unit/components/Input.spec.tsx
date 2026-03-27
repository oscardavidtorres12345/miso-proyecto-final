import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Input from '@/components/Input'

describe('Input', () => {
  describe('rendering', () => {
    it('renders an input element', () => {
      const { container } = render(<Input />)
      expect(container.querySelector('input')).toBeInTheDocument()
    })

    it('passes through HTML attributes', () => {
      render(<Input type="email" placeholder="email@example.com" />)
      const input = screen.getByPlaceholderText('email@example.com')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('does not wrap in input-field div by default', () => {
      const { container } = render(<Input />)
      expect(container.querySelector('.input-field')).not.toBeInTheDocument()
    })
  })

  describe('rightIcon', () => {
    it('renders within input-wrapper when rightIcon is provided', () => {
      const { container } = render(<Input rightIcon={<span>icon</span>} />)
      expect(container.querySelector('.input-wrapper')).toBeInTheDocument()
    })

    it('renders the icon content', () => {
      render(<Input rightIcon={<span>search</span>} />)
      expect(screen.getByText('search')).toBeInTheDocument()
    })

    it('does not render input-wrapper without rightIcon', () => {
      const { container } = render(<Input />)
      expect(container.querySelector('.input-wrapper')).not.toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('applies input--error class when error is true', () => {
      const { container } = render(<Input error={true} />)
      expect(container.querySelector('input')).toHaveClass('input--error')
    })

    it('does not apply input--error class when error is false', () => {
      const { container } = render(<Input error={false} />)
      expect(container.querySelector('input')).not.toHaveClass('input--error')
    })

    it('does not apply input--error class by default', () => {
      const { container } = render(<Input />)
      expect(container.querySelector('input')).not.toHaveClass('input--error')
    })

    it('applies input--error class within input-wrapper when both error and rightIcon are provided', () => {
      const { container } = render(<Input error={true} rightIcon={<span>x</span>} />)
      expect(container.querySelector('input')).toHaveClass('input--error')
      expect(container.querySelector('.input-wrapper')).toBeInTheDocument()
    })
  })

  describe('errorMessage', () => {
    it('wraps output in input-field div when errorMessage is provided', () => {
      const { container } = render(<Input errorMessage="Este campo es obligatorio" />)
      expect(container.querySelector('.input-field')).toBeInTheDocument()
    })

    it('renders error paragraph when error is true and errorMessage is provided', () => {
      render(<Input error={true} errorMessage="Este campo es obligatorio" />)
      expect(screen.getByText('Este campo es obligatorio')).toBeInTheDocument()
    })

    it('does not render error paragraph when error is false', () => {
      render(<Input error={false} errorMessage="Este campo es obligatorio" />)
      expect(screen.queryByText('Este campo es obligatorio')).not.toBeInTheDocument()
    })

    it('does not render error paragraph when errorMessage is not provided', () => {
      const { container } = render(<Input error={true} />)
      expect(container.querySelector('.input-field__error')).not.toBeInTheDocument()
    })

    it('error paragraph has input-field__error class', () => {
      const { container } = render(<Input error={true} errorMessage="error" />)
      expect(container.querySelector('.input-field__error')).toBeInTheDocument()
    })
  })
})
