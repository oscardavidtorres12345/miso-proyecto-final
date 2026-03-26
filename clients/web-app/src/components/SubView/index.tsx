import { useTranslation } from 'react-i18next'
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

const SubView = ({ isOpen, title, onCancel, onApply, children }: SubViewProps) => {
  const { t } = useTranslation()
  return (
    <div className={cn('sub-view', isOpen && 'sub-view--open')}>
      <div className="sub-view__header">
        <span className="sub-view__title">{title}</span>
      </div>
      <div className="sub-view__body">
        {children}
      </div>
      <div className="sub-view__footer">
        <Button variant="secondary" className="btn-full" onClick={onCancel}>
          {t('subview.cancel')}
        </Button>
        <Button variant="primary" className="btn-full" onClick={onApply}>
          {t('subview.apply')}
        </Button>
      </div>
    </div>
  )
}

export default SubView
