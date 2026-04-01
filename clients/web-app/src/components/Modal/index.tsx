import { cn } from '@/lib/utils'
import './Modal.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  body: React.ReactNode
}

const Modal = ({ isOpen, onClose, title, body }: ModalProps) => (
  <>
    <div
      className={cn('modal__overlay', isOpen && 'modal__overlay--open')}
      onClick={onClose}
    />
    <div
      className={cn('modal__panel', isOpen && 'modal__panel--open')}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal__header">
        <h2 id="modal-title" className="modal__title">{title}</h2>
        <button className="modal__close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      </div>
      <div className="modal__body">{body}</div>
    </div>
  </>
)

export default Modal
