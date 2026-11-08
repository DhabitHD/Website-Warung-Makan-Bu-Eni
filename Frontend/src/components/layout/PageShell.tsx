import type { ReactNode } from 'react'
import { SiteHeader } from './SiteHeader'

interface PageShellProps {
  children: ReactNode
}

/** Kerangka halaman: header + konten + footer. */
export function PageShell({ children }: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/70 py-6">
        <p className="text-center text-xs text-muted">
          © {new Date().getFullYear()} Warung Makan Bu Eni · Pesan cukup dengan scan QR
        </p>
      </footer>
    </div>
  )
}
