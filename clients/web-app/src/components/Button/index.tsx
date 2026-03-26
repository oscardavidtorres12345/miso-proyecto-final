import { cn } from '@/lib/utils'
import './Button.css'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
}

const Button = ({ variant = 'primary', className, children, ...props }: ButtonProps) => (
  <button className={cn('btn', `btn--${variant}`, className)} {...props}>
    {children}
  </button>
)

export default Button
