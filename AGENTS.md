# Repository Guidelines

## Mandat Proyek

MNOP (Monitoring Network Operations Platform) harus dikembangkan sebagai aplikasi enterprise yang production-ready, bukan prototype atau demo. Setiap keputusan wajib mengutamakan keamanan, reliabilitas, observabilitas, kemudahan pemeliharaan, dan kompatibilitas mundur. Terapkan Clean Architecture, SOLID, DRY, dan KISS secara pragmatis; jangan menambah abstraksi tanpa kebutuhan nyata.

Gunakan Bahasa Indonesia untuk penjelasan, dokumentasi kerja, laporan, dan komunikasi. Gunakan Bahasa Inggris untuk nama file, folder, class, function, variable, database table/column, API endpoint, serta Git commit.

## Stack Teknologi Wajib

- Backend: Python 3.13+, FastAPI, SQLAlchemy 2.x typed declarative mapping, Pydantic v2, PostgreSQL 17, Redis, Celery, WebSocket, dan JWT.
- Frontend: React 19, Vite, TypeScript, Tailwind CSS, TanStack Query, React Router, Recharts, dan Framer Motion.
- Infrastruktur: Docker, Docker Compose, Ubuntu Server, Nginx, Git, dan GitHub.

Jangan mengganti stack, library utama, pola arsitektur, atau struktur aktif tanpa analisis dampak dan persetujuan eksplisit.

## Audit Repository Sebelum Perubahan

Sebelum mengubah kode:

1. Baca struktur repository dan dokumentasi yang relevan.
2. Jalankan `git status --short`; anggap perubahan yang sudah ada sebagai milik pengguna.
3. Identifikasi entry point, dependency, integrasi, test, dan migration yang terdampak.
4. Audit kandidat direktori berdasarkan konfigurasi runtime, dependency, entry point, import, dokumentasi, test, migration, dan Git history.
5. Pertahankan struktur aktif. Jangan menghapus direktori yang diduga duplikat sebelum audit dilaporkan dan persetujuan diberikan.

Status direktori aktif belum dikonfirmasi. Codex wajib mengaudit `backend/` versus `mnop-backend/`, `frontend/` versus `mnop-frontend/`, serta `infrastructure/` versus `mnop-infra/` berdasarkan `compose.yaml`, `Dockerfile`, dependency, entry point, import, dokumentasi, test, migration, dan Git history sebelum menentukan struktur aktif.

## Struktur dan Arsitektur

Setelah direktori backend aktif dikonfirmasi, pertahankan arsitektur dan struktur yang sudah berjalan. Jangan memindahkan modul sebelum analisis dampak dan persetujuan. Letakkan endpoint dalam router berversi, kontrak request/response dalam schema Pydantic, dan detail database/cache dalam infrastructure sesuai struktur terkonfirmasi. Jaga dependency mengarah ke dalam dan hindari business logic di router.

Frontend harus diorganisasi berdasarkan feature, dengan pemisahan page, reusable component, route, API service, hook, dan type. Hindari komponen monolitik dan duplikasi state server yang seharusnya dikelola TanStack Query.

Jangan menulis pseudocode, placeholder implementasi, kode terpotong, atau `TODO` sebagai pengganti fitur lengkap. Jangan menghapus, menimpa, atau menulis ulang modul yang sudah bekerja tanpa analisis, alasan terukur, dan persetujuan.

## Standar Implementasi

Setiap fitur wajib mencakup sesuai risikonya:

- validasi input dan aturan domain;
- structured logging tanpa data sensitif;
- error handling yang konsisten dan tidak membocorkan detail internal;
- authentication, authorization, least privilege, dan mitigasi abuse;
- unit/integration test untuk jalur sukses, gagal, dan edge case;
- dokumentasi API, konfigurasi, migration, dan keputusan arsitektur yang relevan.

Gunakan type annotation lengkap. Untuk Python, ikuti konfigurasi Ruff dan Mypy pada backend aktif, indentasi empat spasi, serta batas baris yang ditetapkan konfigurasi proyek. Gunakan `snake_case` untuk module/function/variable, `PascalCase` untuk class, dan `UPPER_SNAKE_CASE` untuk constant.

## Database dan Migration

Semua perubahan skema PostgreSQL wajib menggunakan revision Alembic baru pada direktori migration backend yang telah dikonfirmasi. Jangan mengubah migration yang sudah diterapkan; buat migration korektif. Model wajib menggunakan SQLAlchemy 2.x `Mapped` dan `mapped_column`. Pastikan upgrade/downgrade aman, constraint serta index diberi nama konsisten, dan perubahan diuji terhadap PostgreSQL—bukan hanya SQLite.

## Keamanan dan Konfigurasi

Jangan pernah membaca atau menampilkan isi `.env`, password, token, secret key, connection string berkredensial, atau kredensial lain dalam output, log, diff, test fixture, maupun dokumentasi. `.env.example` boleh diperiksa hanya untuk nama variabel konfigurasi; jangan menampilkan atau membuat kredensial nyata. Redaksi nilai sensitif jika muncul tidak sengaja. Jangan menonaktifkan security control hanya agar test atau build lulus.

## Perintah Validasi

Jalankan validasi yang relevan sebelum menyatakan pekerjaan selesai. Perintah backend atau frontend hanya boleh dijalankan setelah direktori aktif, dependency, konfigurasi, executable, dan script terkait dipastikan tersedia.

Dari direktori backend aktif, jika modul dan konfigurasi tool terkait tersedia:

```powershell
python -m pytest
python -m ruff check .
python -m ruff format --check .
python -m mypy app
python -m alembic heads
python -m alembic check
```

Untuk perubahan migration, uji `python -m alembic upgrade head` hanya jika konfigurasi Alembic dan database development/test yang aman telah dikonfirmasi. Jangan menjalankan downgrade pada database bersama atau production.

Dari direktori frontend aktif, hanya jika `package.json`, dependency, lockfile, dan script terkait tersedia, gunakan package manager repository lalu jalankan ekuivalen berikut:

```powershell
npm run lint
npm run test -- --run
npm run build
```

Jangan mengarang script yang tidak ada; periksa `package.json` terlebih dahulu. Jika file Compose aktif dan Docker Compose tersedia, validasi dari lokasi yang sesuai tanpa mencetak konfigurasi atau secret:

```powershell
docker compose config --quiet
docker compose build
```

## Git dan Operasi Berisiko

Jangan menjalankan destructive command tanpa persetujuan eksplisit. Dilarang menjalankan `git reset --hard`, `git clean`, menghapus atau menimpa migration, menghapus volume database, atau menghapus direktori. Jangan membuat commit, branch, tag, push, pull request, atau perubahan remote kecuali diminta.

Commit yang diminta harus berbahasa Inggris dan mengikuti pola Conventional Commits, misalnya `feat(auth): add refresh token rotation`. Sebelum menyerahkan hasil, periksa diff dan status Git, pastikan hanya file dalam scope yang berubah, lalu laporkan file yang diubah, validasi yang dijalankan, hasilnya, serta risiko atau pekerjaan tersisa secara jujur.
