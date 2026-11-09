import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Input teks standar admin — tinggi sentuh 44px, fokus hijau merek. */
function Input({ className, type = 'text', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-11 w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
