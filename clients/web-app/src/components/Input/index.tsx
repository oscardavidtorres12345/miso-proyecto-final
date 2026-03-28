import { cn } from '@/lib/utils'
import './Input.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  rightIcon?: React.ReactNode
  error?: boolean
  errorMessage?: string
}

const Input = ({ className, rightIcon, error, errorMessage, ...props }: InputProps) => {
  const inputEl = rightIcon ? (
    <div className="input-wrapper">
      <input className={cn('input', error && 'input--error', className)} {...props} />
      <span className="input-wrapper__icon">{rightIcon}</span>
    </div>
  ) : (
    <input className={cn('input', error && 'input--error', className)} {...props} />
  )

  if (errorMessage !== undefined) {
    return (
      <div className="input-field">
        <div className={cn('input-box', error && 'input-box--error')}>
          {inputEl}
        </div>
        {error && <p className="input-field__error">{errorMessage}</p>}
      </div>
    )
  }

  return inputEl
}

export default Input
