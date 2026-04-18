import { useAuth } from '@/context/AuthContext'
import Unauthorized from '@/pages/Unauthorized'
import { UserRole } from '@/types/user'

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}) => {
  const { isAuthenticated, session } = useAuth()

  if (!isAuthenticated) return <Unauthorized />
  if (allowedRoles && session && !allowedRoles.includes(session.user.role)) {
    return <Unauthorized variant="forbidden" />
  }
  return <>{children}</>
}

export default ProtectedRoute
