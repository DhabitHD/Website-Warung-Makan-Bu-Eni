import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        brand: 'bg-brand text-surface',
        accent: 'bg-accent text-surface',
        muted: 'bg-secondary text-muted-foreground',
        outline: 'border border-border bg-surface text-ink',
      },
    },
    defaultVariants: {
      variant: 'muted',
    },
  },
)

/** Badge status: kategori, ketersediaan, status pesanan. */
function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
