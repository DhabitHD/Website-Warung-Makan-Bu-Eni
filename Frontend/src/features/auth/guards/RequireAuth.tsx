import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'

interface RequireAuthProps {
  children: ReactNode
}

/** Penjaga rute /admin/* — bila belum login, lempar ke halaman login. */
export function RequireAuth({ children }: RequireAuthProps) {
  const admin = useAuthStore((state) => state.admin)

  if (!admin) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
