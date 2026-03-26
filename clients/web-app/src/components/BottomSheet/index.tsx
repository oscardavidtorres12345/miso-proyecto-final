import { cn } from '@/lib/utils'
import './BottomSheet.css'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

const BottomSheet = ({ isOpen, onClose, children, className }: BottomSheetProps) => (
  <>
    <div
      className={cn('bottom-sheet__overlay', isOpen && 'bottom-sheet__overlay--open')}
      onClick={onClose}
    />
    <div className={cn('bottom-sheet__panel', isOpen && 'bottom-sheet__panel--open', className)}>
      {children}
    </div>
  </>
)

export default BottomSheet
