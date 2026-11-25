#!/usr/bin/env bash
# Menguji skema PostgreSQL di container Docker yang bersih.
#
#   ./db/test.sh                  # dari folder Backend/
#   PG_IMAGE=postgres:17-alpine ./db/test.sh
#
# Urutan: schema.sql → fixtures/seed.sql → fixtures/helpers.sql → tests/*.sql
# Setiap berkas tes berjalan dalam transaksi yang di-ROLLBACK, jadi tes tidak
# saling memengaruhi. Berhenti di galat pertama dengan kode keluar non-nol.

set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
IMAGE="${PG_IMAGE:-postgres:16-alpine}"
NAMA="warung-uji-$$"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker tidak ditemukan. Pasang Docker lalu jalankan ulang." >&2
  exit 2
fi

bersihkan() {
  docker rm -f "$NAMA" >/dev/null 2>&1 || true
}
trap bersihkan EXIT

# Pastikan schema.sql sama dengan DDL di dokumen (docs/SKEMA-POSTGRESQL.md bagian 3).
DDL_DOKUMEN="$(awk '/^```sql/{buf="";f=1;next} /^```/{if(f&&buf~/CREATE/)printf "%s\n", buf; f=0; next} f{buf=buf $0 "\n"}' "$DIR/../docs/SKEMA-POSTGRESQL.md")"
DDL_FILE="$(sed -n '4,$p' "$DIR/schema.sql")"
if [ "$DDL_DOKUMEN" != "$DDL_FILE" ]; then
  echo "schema.sql tidak sama dengan DDL di docs/SKEMA-POSTGRESQL.md. Sinkronkan keduanya." >&2
  exit 4
fi
echo "== DDL di dokumen dan schema.sql sama"

echo "== Menyalakan PostgreSQL ($IMAGE)"
docker run -d --name "$NAMA" \
  -e POSTGRES_PASSWORD=uji -e POSTGRES_DB=warung \
  -v "$DIR:/db:ro" \
  "$IMAGE" >/dev/null

# Image resmi menjalankan server sementara lalu me-restart-nya. Tunggu sampai
# pesan "ready to accept connections" muncul dua kali, supaya tidak masuk
# ke server sementara.
siap=0
for _ in $(seq 1 90); do
  if [ "$(docker logs "$NAMA" 2>&1 | grep -c 'ready to accept connections')" -ge 2 ]; then
    siap=1
    break
  fi
  sleep 1
done
if [ "$siap" -ne 1 ]; then
  echo "PostgreSQL tidak siap dalam 90 detik." >&2
  docker logs "$NAMA" >&2 || true
  exit 1
fi

psql_di_container() {
  docker exec -i "$NAMA" psql -U postgres -d warung \
    -X -q -v ON_ERROR_STOP=1 "$@"
}

echo "== Versi: $(docker exec "$NAMA" psql -U postgres -d warung -tAc 'SELECT version()')"
echo "== Tanggal mesin: $(date '+%Y-%m-%d %H:%M:%S %Z')"

echo "== Skema"
psql_di_container -f /db/schema.sql

echo "== Data contoh"
psql_di_container -f /db/fixtures/seed.sql

echo "== Pembantu"
psql_di_container -f /db/fixtures/helpers.sql

for berkas in "$DIR"/tests/*.sql; do
  nama_berkas="$(basename "$berkas")"
  echo "== Tes: $nama_berkas"
  psql_di_container -f "/db/tests/$nama_berkas"
done

echo
echo "SEMUA TES LULUS"
