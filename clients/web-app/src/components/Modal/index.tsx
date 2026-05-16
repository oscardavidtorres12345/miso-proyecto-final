import { cn } from '@/lib/utils'
import Button from '@/components/Button'
import './Modal.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  body?: React.ReactNode
  message?: React.ReactNode
  cancelLabel?: string
  confirmLabel?: string
  onConfirm?: () => void
  confirmDisabled?: boolean
  onCancel?: () => void
}

const Modal = ({
  isOpen,
  onClose,
  title,
  body,
  message,
  cancelLabel,
  confirmLabel,
  onConfirm,
  confirmDisabled,
  onCancel,
}: ModalProps) => {
  const handleCancel = onCancel ?? onClose
  const shouldRenderActions = Boolean(onConfirm || cancelLabel || confirmLabel)

  return (
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
        <div className="modal__body">
          {body ?? (message ? <p className="modal__message">{message}</p> : null)}
          {shouldRenderActions ? (
            <div className="modal__actions">
              <Button type="button" variant="outline" className="modal__action-btn" onClick={handleCancel}>
                {cancelLabel ?? 'Cancelar'}
              </Button>
              {onConfirm || confirmLabel ? (
                <Button type="button" variant="primary" className="modal__action-btn" onClick={onConfirm} disabled={confirmDisabled}>
                  {confirmLabel ?? 'Confirmar'}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default Modal
