import { cn } from '@/lib/utils'
import './Input.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  rightIcon?: React.ReactNode
}

const Input = ({ className, rightIcon, ...props }: InputProps) => {
  if (rightIcon) {
    return (
      <div className="input-wrapper">
        <input className={cn('input', className)} {...props} />
        <span className="input-wrapper__icon">{rightIcon}</span>
      </div>
    )
  }
  return <input className={cn('input', className)} {...props} />
}

export default Input
