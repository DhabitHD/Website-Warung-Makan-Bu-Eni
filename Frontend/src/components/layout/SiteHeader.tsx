import type { ReactNode } from 'react'
import { Container } from './Container'

interface SiteHeaderProps {
  children?: ReactNode
}

/** Header identitas warung. */
export function SiteHeader({ children }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background">
      <Container className="flex h-16 items-center justify-between gap-4">
        <a href="/" className="flex items-baseline gap-2">
          <span className="font-display text-lg font-semibold text-brand">Warung Makan</span>
          <span className="font-display text-lg font-medium text-accent italic">Bu Eni</span>
        </a>
        {children}
      </Container>
    </header>
  )
}
