import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { History, LayoutDashboard, LogOut, Menu as MenuIcon, Receipt, UtensilsCrossed, X } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  ikon: typeof LayoutDashboard
  /** Tautan index butuh `end` agar tidak selalu aktif. */
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Dashboard', ikon: LayoutDashboard, end: true },
  { to: '/admin/menu', label: 'Kelola Menu', ikon: UtensilsCrossed },
  { to: '/admin/pesanan', label: 'Pesanan', ikon: Receipt },
  { to: '/admin/riwayat', label: 'Riwayat', ikon: History },
]

/** Daftar tautan navigasi — dipakai sidebar desktop & drawer mobile. */
function NavList({ onPilih }: { onPilih?: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, ikon: Ikon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onPilih}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface',
                isActive
                  ? 'bg-surface/15 text-surface'
                  : 'text-surface/75 hover:bg-surface/10 hover:text-surface',
              )
            }
          >
            <Ikon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

/** Identitas merek di kepala sidebar/bilah atas. */
function BrandAdmin({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={cn('font-display font-semibold text-surface', compact ? 'text-base' : 'text-lg')}>
        Warung Makan
      </span>
      <span className={cn('font-display font-medium text-accent italic', compact ? 'text-base' : 'text-lg')}>
        Bu Eni
      </span>
      <span className="rounded-full bg-surface/15 px-2 py-0.5 text-[0.65rem] font-semibold tracking-widest text-surface/80 uppercase">
        Admin
      </span>
    </div>
  )
}

/**
 * Kerangka dashboard admin (Fase 2 — MILIK LEAD).
 * Sidebar hijau merek di desktop, drawer di mobile; konten lewat <Outlet />.
 */
export function AdminLayout() {
  const [drawerTerbuka, setDrawerTerbuka] = useState(false)
  const admin = useAuthStore((state) => state.admin)
  const keluar = useAuthStore((state) => state.keluar)
  const navigate = useNavigate()

  const handleKeluar = () => {
    keluar()
    setDrawerTerbuka(false)
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Bilah atas (mobile) ─────────────────────────── */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 bg-brand px-4 lg:hidden">
        <BrandAdmin compact />
        <button
          type="button"
          onClick={() => setDrawerTerbuka((b) => !b)}
          aria-expanded={drawerTerbuka}
          aria-controls="nav-admin-mobile"
          aria-label={drawerTerbuka ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          className="flex size-10 items-center justify-center rounded-lg text-surface hover:bg-surface/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface"
        >
          {drawerTerbuka ? <X className="size-5" aria-hidden="true" /> : <MenuIcon className="size-5" aria-hidden="true" />}
        </button>
      </header>

      {drawerTerbuka && (
        <nav
          id="nav-admin-mobile"
          aria-label="Navigasi admin"
          className="border-t border-surface/15 bg-brand px-3 py-3 lg:hidden"
        >
          <NavList onPilih={() => setDrawerTerbuka(false)} />
          <button
            type="button"
            onClick={handleKeluar}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface/75 transition-colors hover:bg-surface/10 hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface"
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            Keluar
          </button>
        </nav>
      )}

      {/* ── Sidebar (desktop) ───────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-brand lg:flex">
        <div className="border-b border-surface/15 px-5 py-5">
          <BrandAdmin />
        </div>
        <nav aria-label="Navigasi admin" className="flex-1 overflow-y-auto p-3">
          <NavList />
        </nav>
        <div className="border-t border-surface/15 p-4">
          <p className="truncate text-xs text-surface/70">
            Masuk sebagai <span className="font-medium text-surface">{admin?.nama ?? 'Admin'}</span>
          </p>
          <button
            type="button"
            onClick={handleKeluar}
            className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface/75 transition-colors hover:bg-surface/10 hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface"
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            Keluar
          </button>
        </div>
      </aside>

      {/* ── Konten ──────────────────────────────────────── */}
      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <footer className="border-t border-border/70 py-5">
          <p className="text-center text-xs text-muted-foreground">
            Dashboard Admin · Warung Makan Bu Eni — data masih contoh (mock) sampai Tahap 4
          </p>
        </footer>
      </div>
    </div>
  )
}
