import { Badge } from '@/components/ui/badge'
import {
  labelPembayaran,
  labelStatusPesanan,
  varianPembayaran,
  varianStatusPesanan,
} from '../../lib/pesanan'
import type { StatusPembayaran, StatusPesanan } from '../../types'

export function BadgeStatusPesanan({ status }: { status: StatusPesanan }) {
  return <Badge variant={varianStatusPesanan(status)}>{labelStatusPesanan(status)}</Badge>
}

export function BadgePembayaran({ status }: { status: StatusPembayaran }) {
  return <Badge variant={varianPembayaran(status)}>{labelPembayaran(status)}</Badge>
}

/** Dua badge berdampingan untuk status pesanan dan pembayaran. */
export function BadgePesanan({
  status,
  pembayaran,
}: {
  status: StatusPesanan
  pembayaran: StatusPembayaran
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <BadgeStatusPesanan status={status} />
      <BadgePembayaran status={pembayaran} />
    </div>
  )
}
