import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Tabel data admin — wadah scroll horizontal di layar sempit. */
function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table data-slot="table" className={cn('w-full text-sm', className)} {...props} />
    </div>
  )
}

function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead data-slot="table-header" className={cn('[&_tr]:border-b', className)} {...props} />
}

function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody data-slot="table-body" className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
}

function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      data-slot="table-row"
      className={cn('border-b border-border transition-colors hover:bg-secondary/60', className)}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'h-11 px-3 text-left align-middle text-xs font-semibold tracking-wide text-muted-foreground uppercase',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td data-slot="table-cell" className={cn('px-3 py-3 align-middle', className)} {...props} />
  )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
