import type { LabelHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Label form — pasangkan lewat `htmlFor` dengan id input. */
function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      data-slot="label"
      className={cn('text-sm font-medium text-ink', className)}
      {...props}
    />
  )
}

export { Label }
