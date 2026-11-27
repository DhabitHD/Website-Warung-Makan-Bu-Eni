import { SearchInput } from '@/components/shared/SearchInput'
import { labelPembayaran, labelStatusPesanan } from '../../lib/pesanan'
import type { StatusPembayaran, StatusPesanan } from '../../types'

interface FilterPesananProps {
  pencarian: string
  onPencarian: (nilai: string) => void
  status: StatusPesanan | 'semua'
  onStatus: (nilai: StatusPesanan | 'semua') => void
  pembayaran: StatusPembayaran | 'semua'
  onPembayaran: (nilai: StatusPembayaran | 'semua') => void
  opsiStatus: StatusPesanan[]
}

const KELAS_SELECT =
  'h-11 rounded-lg border border-border bg-surface px-3 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none'

/** Pencarian dan filter status/pembayaran untuk daftar pesanan. */
export function FilterPesanan({
  pencarian,
  onPencarian,
  status,
  onStatus,
  pembayaran,
  onPembayaran,
  opsiStatus,
}: FilterPesananProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-status" className="text-xs font-medium text-muted-foreground">
            Status pesanan
          </label>
          <select
            id="filter-status"
            value={status}
            onChange={(event) =>
              onStatus(event.target.value as StatusPesanan | 'semua')
            }
            className={KELAS_SELECT}
          >
            <option value="semua">Semua status</option>
            {opsiStatus.map((nilai) => (
              <option key={nilai} value={nilai}>
                {labelStatusPesanan(nilai)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-pembayaran" className="text-xs font-medium text-muted-foreground">
            Pembayaran
          </label>
          <select
            id="filter-pembayaran"
            value={pembayaran}
            onChange={(event) =>
              onPembayaran(event.target.value as StatusPembayaran | 'semua')
            }
            className={KELAS_SELECT}
          >
            <option value="semua">Semua pembayaran</option>
            <option value="belum">{labelPembayaran('belum')}</option>
            <option value="dibayar">{labelPembayaran('dibayar')}</option>
          </select>
        </div>
      </div>

      <SearchInput
        value={pencarian}
        onChange={onPencarian}
        placeholder="Cari nomor, nama, atau meja..."
        className="sm:w-72"
      />
    </div>
  )
}
