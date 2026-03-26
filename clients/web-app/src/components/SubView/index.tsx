import { cn } from '@/lib/utils'
import Button from '@/components/Button'
import './SubView.css'

interface SubViewProps {
  isOpen: boolean
  title: string
  onCancel: () => void
  onApply: () => void
  children: React.ReactNode
}

const SubView = ({ isOpen, title, onCancel, onApply, children }: SubViewProps) => (
  <div className={cn('sub-view', isOpen && 'sub-view--open')}>
    <div className="sub-view__header">
      <span className="sub-view__title">{title}</span>
    </div>
    <div className="sub-view__body">
      {children}
    </div>
    <div className="sub-view__footer">
      <Button variant="secondary" className="sub-view__btn" onClick={onCancel}>
        Cancelar
      </Button>
      <Button variant="primary" className="sub-view__btn" onClick={onApply}>
        Aplicar
      </Button>
    </div>
  </div>
)

export default SubView
