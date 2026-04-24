import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Modal from '@/components/Modal'

describe('Modal', () => {
  describe('when closed', () => {
    it('renders the dialog element in the DOM', () => {
      render(<Modal isOpen={false} onClose={vi.fn()} title="Título" body={<p>Contenido</p>} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('does not show the panel as visible (no --open class)', () => {
      const { container } = render(
        <Modal isOpen={false} onClose={vi.fn()} title="Título" body={<p>Contenido</p>} />
      )
      expect(container.querySelector('.modal__panel--open')).not.toBeInTheDocument()
    })
  })

  describe('when open', () => {
    it('renders the title', () => {
      render(<Modal isOpen={true} onClose={vi.fn()} title="Aviso de Privacidad" body={<p>Contenido</p>} />)
      expect(screen.getByText('Aviso de Privacidad')).toBeInTheDocument()
    })

    it('renders the body content', () => {
      render(<Modal isOpen={true} onClose={vi.fn()} title="Título" body={<p>Texto del cuerpo</p>} />)
      expect(screen.getByText('Texto del cuerpo')).toBeInTheDocument()
    })

    it('renders ReactNode body with links', () => {
      render(
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          title="Título"
          body={<a href="https://example.com/doc.pdf">Ver PDF</a>}
        />
      )
      expect(screen.getByRole('link', { name: 'Ver PDF' })).toHaveAttribute('href', 'https://example.com/doc.pdf')
    })

    it('calls onClose when clicking the close button', () => {
      const onClose = vi.fn()
      render(<Modal isOpen={true} onClose={onClose} title="Título" body={<p>Contenido</p>} />)
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('calls onClose when clicking the overlay', () => {
      const onClose = vi.fn()
      const { container } = render(
        <Modal isOpen={true} onClose={onClose} title="Título" body={<p>Contenido</p>} />
      )
      fireEvent.click(container.querySelector('.modal__overlay')!)
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('renders confirm modal content when using message and labels', () => {
      render(
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          title="Confirmar acción"
          message="Esta acción no se puede deshacer."
          cancelLabel="Volver"
          confirmLabel="Eliminar"
          onConfirm={vi.fn()}
        />
      )

      expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()
    })

    it('calls onConfirm and onCancel when action buttons are clicked', () => {
      const onClose = vi.fn()
      const onCancel = vi.fn()
      const onConfirm = vi.fn()
      render(
        <Modal
          isOpen={true}
          onClose={onClose}
          onCancel={onCancel}
          onConfirm={onConfirm}
          title="Confirmar acción"
          message="¿Deseas continuar?"
          cancelLabel="Cancelar"
          confirmLabel="Estoy seguro"
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
      fireEvent.click(screen.getByRole('button', { name: 'Estoy seguro' }))

      expect(onCancel).toHaveBeenCalledOnce()
      expect(onConfirm).toHaveBeenCalledOnce()
      expect(onClose).not.toHaveBeenCalled()
    })

    it('falls back to onClose when onCancel is not provided', () => {
      const onClose = vi.fn()
      const onConfirm = vi.fn()
      render(
        <Modal
          isOpen={true}
          onClose={onClose}
          onConfirm={onConfirm}
          title="Confirmar acción"
          message="¿Deseas continuar?"
          cancelLabel="Cancelar"
          confirmLabel="Estoy seguro"
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

      expect(onClose).toHaveBeenCalledOnce()
      expect(onConfirm).not.toHaveBeenCalled()
    })
  })
})
