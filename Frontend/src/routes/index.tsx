import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MenuPage } from '@/pages/MenuPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { OrderSuccessPage } from '@/pages/OrderSuccessPage'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { RequireAuth } from '@/features/auth/guards/RequireAuth'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminMenuPage } from '@/pages/admin/AdminMenuPage'
import { AdminMenuFormPage } from '@/pages/admin/AdminMenuFormPage'
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage'
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage'
import { AdminOrderDetailPage } from '@/pages/admin/AdminOrderDetailPage'
import { AdminHistoryPage } from '@/pages/admin/AdminHistoryPage'

/**
 * Routing aplikasi.
 * URL QR: /menu?table=A01  →  nomor meja dibaca dari query string.
 * Dashboard admin: /admin/* dijaga RequireAuth (sesi mock, Fase 2).
 */
export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/menu" replace /> },
  { path: '/menu', element: <MenuPage /> },
  { path: '/cart', element: <CartPage /> },
  { path: '/checkout', element: <CheckoutPage /> },
  { path: '/order-success', element: <OrderSuccessPage /> },
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <AdminOverviewPage /> },
      { path: 'menu', element: <AdminMenuPage /> },
      { path: 'menu/baru', element: <AdminMenuFormPage /> },
      { path: 'menu/:id/edit', element: <AdminMenuFormPage /> },
      { path: 'pesanan', element: <AdminOrdersPage /> },
      { path: 'pesanan/:id', element: <AdminOrderDetailPage /> },
      { path: 'riwayat', element: <AdminHistoryPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/menu" replace /> },
])
