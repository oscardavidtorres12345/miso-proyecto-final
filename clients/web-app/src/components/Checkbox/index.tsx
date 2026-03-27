import { cn } from '@/lib/utils'
import './Checkbox.css'

interface CheckboxProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: React.ReactNode
  className?: string
}

const Checkbox = ({ id, checked, onChange, label, className }: CheckboxProps) => (
  <div className={cn('checkbox', className)}>
    <input
      id={id}
      type="checkbox"
      className="checkbox__input"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
    />
    <label htmlFor={id} className="checkbox__label">
      {label}
    </label>
  </div>
)

export default Checkbox
