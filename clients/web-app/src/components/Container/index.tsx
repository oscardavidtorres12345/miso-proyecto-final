import { cn } from '@/lib/utils'
import './Container.css'

interface ContainerProps {
  children: React.ReactNode
  className?: string
}

const Container = ({ children, className }: ContainerProps) => (
  <div className={cn('page-container', className)}>
    {children}
  </div>
)

export default Container
