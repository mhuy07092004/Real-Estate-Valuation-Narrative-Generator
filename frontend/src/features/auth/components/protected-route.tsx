import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { getDefaultDashboardRole } from '../../dashboard/utils/dashboard-role'
import { useAuth } from '../hooks/use-auth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  if (getDefaultDashboardRole(user?.roles ?? []) === null) {
    return <Navigate to="/select-role" replace />
  }

  return children
}

export function SelectRoleRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  if (getDefaultDashboardRole(user?.roles ?? []) !== null) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
