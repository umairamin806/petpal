import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a route that requires authentication.
 *
 * Props:
 *   requiredRole – 'owner' | 'provider' | undefined (any authenticated user)
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { isLoading, isAuthenticated, profile } = useAuth()
  const location = useLocation()

  // Still bootstrapping session
  if (isLoading) {
    return (
      <div className="page-loading" aria-live="polite">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return children
}
