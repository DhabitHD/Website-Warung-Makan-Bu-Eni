import { ReceiptText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatRupiah } from '@/lib/currency'
import { formatWaktu } from '../../lib/pesanan'
import type { OrderResult } from '../../types'
import { BadgePesanan } from './BadgePesanan'

interface TabelPesananProps {
  pesanan: OrderResult[]
  judulKosong?: string
  deskripsiKosong?: string
}

/** Daftar pesanan admin: tabel di layar besar, kartu di layar kecil. */
export function TabelPesanan({
  pesanan,
  judulKosong = 'Belum ada pesanan',
  deskripsiKosong = 'Pesanan baru akan muncul di sini setelah pelanggan mengirim dari halaman checkout.',
}: TabelPesananProps) {
  if (pesanan.length === 0) {
    return (
      <EmptyState
        ikon={<ReceiptText className="size-7 text-muted-foreground" aria-hidden="true" />}
        judul={judulKosong}
        deskripsi={deskripsiKosong}
      />
    )
  }

  return (
    <>
      {/* Tabel — layar besar */}
      <div className="hidden rounded-xl border border-border bg-surface shadow-card lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor</TableHead>
              <TableHead>Pemesan</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pesanan.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link
                    to={`/admin/pesanan/${item.id}`}
                    className="font-semibold text-brand hover:underline"
                  >
                    {item.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-ink">{item.nama}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.nomorMeja ? `Meja ${item.nomorMeja}` : 'Tanpa meja'}
                  </p>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatWaktu(item.dibuatPada)}
                </TableCell>
                <TableCell className="font-medium whitespace-nowrap text-ink">
                  Rp{formatRupiah(item.totalHarga)}
                </TableCell>
                <TableCell>
                  <BadgePesanan status={item.status} pembayaran={item.pembayaran} />
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    to={`/admin/pesanan/${item.id}`}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    Detail
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Kartu — layar kecil */}
      <ul className="flex flex-col gap-3 lg:hidden">
        {pesanan.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-border bg-surface p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  to={`/admin/pesanan/${item.id}`}
                  className="font-display text-lg font-semibold text-brand hover:underline"
                >
                  {item.id}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatWaktu(item.dibuatPada)}
                </p>
              </div>
              <BadgePesanan status={item.status} pembayaran={item.pembayaran} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Pemesan</dt>
                <dd className="mt-0.5 font-medium text-ink">{item.nama}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Meja</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {item.nomorMeja || 'Tanpa meja'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Total</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  Rp{formatRupiah(item.totalHarga)}
                </dd>
              </div>
              <div className="flex items-end justify-end">
                <Link
                  to={`/admin/pesanan/${item.id}`}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  Lihat detail
                </Link>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}
