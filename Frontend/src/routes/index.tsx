import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MenuPage } from '@/pages/MenuPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { OrderSuccessPage } from '@/pages/OrderSuccessPage'

/**
 * Routing aplikasi.
 * URL QR: /menu?table=A01  →  nomor meja dibaca dari query string.
 */
export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/menu" replace /> },
  { path: '/menu', element: <MenuPage /> },
  { path: '/cart', element: <CartPage /> },
  { path: '/checkout', element: <CheckoutPage /> },
  { path: '/order-success', element: <OrderSuccessPage /> },
  { path: '*', element: <Navigate to="/menu" replace /> },
])
