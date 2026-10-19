# Pendaftaran Natal GBI ROCK Ubud 2026

Stack: Next.js 15 (App Router) + Supabase. Bahasa antarmuka: Indonesia.

## Keputusan panitia
- 1 sesi ibadah, 20 Des 2026, 09.00 WITA
- Kuota terpisah: dewasa 150, anak 75, pelayan 50
- Balita (0-4 th) tidak dapat kursi/porsi
- Konsumsi katering 1 menu tetap, cadangan 10%
- Tamu luar jemaat boleh daftar
- Lansia tanpa HP didaftarkan oleh Gembala Komsel
- Admin 2-3 orang, batas tutup pendaftaran belum ditentukan

## Aturan teknis
- Akses database hanya dari server (service role), jangan bocor ke client
- Pengecekan kuota hanya lewat fungsi SQL daftar_hadir (atomik)

## Tahap pengerjaan
1. DONE: skema + form jemaat/tamu + halaman sukses (tanpa konsumsi/kebutuhan khusus; nama wajib per orang, tabel peserta)
2. DONE (belum dites di Supabase; jalankan supabase/tahap2.sql): jalur Gembala Komsel (input banyak keluarga, kode KOM-xx) dan jalur pelayan
3. DONE: QR check-in (1 QR per pendaftaran, isi = kode_daftar, hanya status terdaftar) dan pesan konfirmasi WA MANUAL lewat tautan wa.me (keputusan: tanpa provider/gateway pihak ketiga)
4. DONE (belum dites di Supabase; jalankan supabase/tahap4.sql, isi ADMIN_PASSWORD): dashboard admin /admin (satu kata sandi bersama, cookie HMAC) + export Excel. Perubahan status lewat fungsi SQL ubah_status (atomik, cek kuota)
5. Halaman scan check-in hari H

Kerjakan per tahap dan minta konfirmasi sebelum lanjut ke tahap berikutnya.