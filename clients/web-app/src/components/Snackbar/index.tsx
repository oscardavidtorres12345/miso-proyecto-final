import { useEffect, useRef } from 'react'
import './Snackbar.css'

type SnackbarProps = {
  show: boolean
  message: string
  variant: 'success' | 'error'
  onClose: () => void
  duration?: number
}

const Snackbar = ({ show, message, variant, onClose, duration = 4000 }: SnackbarProps) => {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!show) return
    const timer = setTimeout(() => onCloseRef.current(), duration)
    return () => clearTimeout(timer)
  }, [show, duration])

  return (
    <div
      role="alert"
      aria-hidden={!show}
      className={`snackbar snackbar--${variant}${show ? ' snackbar--visible' : ''}`}
    >
      <span className="snackbar__message">{message}</span>
      <button className="snackbar__close" onClick={onClose} aria-label="Cerrar">✕</button>
    </div>
  )
}

export default Snackbar
