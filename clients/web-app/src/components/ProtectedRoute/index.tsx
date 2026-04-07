import { useAuth } from '@/context/AuthContext'
import Unauthorized from '@/pages/Unauthorized'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Unauthorized />
}

export default ProtectedRoute
