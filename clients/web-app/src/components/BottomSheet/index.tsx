import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import './BottomSheet.css'

const bottomSheetClearanceVar = '--bottom-sheet-clearance'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

const BottomSheet = ({ isOpen, onClose, children, className }: BottomSheetProps) => {
  const panelRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = panelRef.current
    if (!isOpen || !el) {
      document.documentElement.style.removeProperty(bottomSheetClearanceVar)
      return
    }

    const sync = () => {
      document.documentElement.style.setProperty(bottomSheetClearanceVar, `${el.offsetHeight}px`)
    }

    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    window.visualViewport?.addEventListener('resize', sync)

    return () => {
      ro.disconnect()
      window.visualViewport?.removeEventListener('resize', sync)
      document.documentElement.style.removeProperty(bottomSheetClearanceVar)
    }
  }, [isOpen])

  return (
    <>
      <div
        className={cn('bottom-sheet__overlay', isOpen && 'bottom-sheet__overlay--open')}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={cn('bottom-sheet__panel', isOpen && 'bottom-sheet__panel--open', className)}
      >
        {children}
      </div>
    </>
  )
}

export default BottomSheet
