-- Pembantu pengujian. Dijalankan setelah seed.sql.
--
-- uji_gagal(stmt, sqlstate, label)
--   Menjalankan stmt dan memastikan ia GAGAL dengan SQLSTATE yang diharapkan.
--   - Jika stmt berhasil          → galat "SEHARUSNYA DITOLAK" (tes gagal)
--   - Jika gagal dengan SQLSTATE lain → galat (tes gagal)
--   - Jika gagal dengan SQLSTATE sama → NOTICE PASS (tes lulus)

CREATE OR REPLACE FUNCTION uji_gagal(stmt text, kondisi text, label text)
RETURNS void
LANGUAGE plpgsql
AS $fn$
BEGIN
  EXECUTE stmt;
  RAISE EXCEPTION 'SEHARUSNYA DITOLAK: %', label;
EXCEPTION WHEN OTHERS THEN
  IF SQLSTATE = kondisi THEN
    RAISE NOTICE 'PASS: %', label;
  ELSE
    RAISE EXCEPTION 'GAGAL: % — SQLSTATE %, diharapkan %: %', label, SQLSTATE, kondisi, SQLERRM;
  END IF;
END
$fn$;
