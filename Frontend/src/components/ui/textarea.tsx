import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Textarea untuk deskripsi/catatan — ikut gaya `Input`. */
function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
