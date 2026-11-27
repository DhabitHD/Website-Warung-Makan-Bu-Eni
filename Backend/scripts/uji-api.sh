#!/usr/bin/env bash
# Menguji API terhadap PostgreSQL 16 sungguhan di Docker (container bersih).
#   npm run uji:api   (dari folder Backend/)
set -euo pipefail

cd "$(dirname "$0")/.."
NAMA="warung-api-uji-$$"
PORT_DB=55460
TOKEN="uji-token-minimal-16-karakter"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker tidak ditemukan." >&2
  exit 2
fi

bersihkan() { docker rm -f "$NAMA" >/dev/null 2>&1 || true; }
trap bersihkan EXIT

docker run -d --name "$NAMA" -e POSTGRES_PASSWORD=uji -e POSTGRES_DB=warung \
  -p "$PORT_DB:5432" postgres:16-alpine >/dev/null

siap=0
for _ in $(seq 1 90); do
  if [ "$(docker logs "$NAMA" 2>&1 | grep -c 'ready to accept connections')" -ge 2 ]; then
    siap=1; break
  fi
  sleep 1
done
if [ "$siap" -ne 1 ]; then
  echo "PostgreSQL tidak siap." >&2; exit 1
fi

export DATABASE_URL="postgres://postgres:uji@localhost:$PORT_DB/warung"
export PEMILIK_TOKEN="$TOKEN"
export CORS_ORIGIN="http://localhost:5173"

npx tsx scripts/migrasi.ts --seed
node --import tsx --test test/api.test.ts test/unit.test.ts
