# Brief Redesain UI/UX — Pendaftaran Natal GBI ROCK Ubud 2026

Dokumen ini menjelaskan fitur, alur, halaman, dan kondisi tampilan saat ini dari web pendaftaran Natal GBI ROCK Ubud 2026, sebagai bahan kerja UI/UX designer. Semua teks antarmuka berbahasa **Indonesia**.

---

## 1. Ringkasan

| | |
|---|---|
| **Tujuan web** | Pendaftaran kehadiran Ibadah Natal, pengaturan kuota kursi, check-in di hari H, dan rekap untuk panitia (termasuk kebutuhan katering). |
| **Acara** | Natal GBI ROCK Ubud 2026 — Minggu, 20 Desember 2026, 09.00 WITA, satu sesi ibadah |
| **Lokasi** | The Westin Resort & Spa Ubud, Bali (ada tautan Google Maps) |
| **Pengguna utama** | (1) Jemaat & tamu, (2) Gembala Komsel, (3) Pelayan ibadah, (4) Panitia/admin |
| **Perangkat dominan** | **Mobile** (jemaat mendaftar dari HP, lalu menyimpan/screenshot QR). Admin memakai laptop untuk dashboard dan HP untuk scan QR di lokasi. |
| **Teknologi** | Next.js 15 (App Router) + Supabase. CSS tunggal tanpa library UI (`app/globals.css`). |
| **Bahasa** | Indonesia. Sapaan pesan WA: "Shalom …" |

**Karakter pengguna yang perlu diperhatikan:** jemaat lintas usia termasuk orang tua yang kurang akrab teknologi; banyak yang mengisi untuk satu keluarga sekaligus; gembala komsel mengisi banyak keluarga dalam sekali duduk; di hari H panitia harus check-in dengan cepat di tengah antrean.

---

## 2. Aturan bisnis yang memengaruhi desain

- **Kuota terpisah** per kategori: Dewasa **150**, Anak **75**, Pelayan **50**.
- **Dewasa** = 13 tahun ke atas; **Anak** = 12 tahun ke bawah.
- **Balita (0–4 th) tidak mendapat kursi/porsi.** (Saat ini form tidak menyediakan pilihan balita; hanya Dewasa dan Anak. Lihat "Pertanyaan terbuka".)
- Kuota penuh **tidak menolak** pendaftar: otomatis masuk **Daftar Tunggu**; panitia menghubungi lewat WhatsApp bila ada kursi kosong.
- Jemaat **dan tamu luar jemaat** boleh daftar.
- Lansia tanpa HP didaftarkan oleh **Gembala Komsel**.
- **Nama wajib diisi per orang** (tidak cukup mengisi jumlah). Gender juga wajib per orang.
- Satu nomor WA boleh dipakai mendaftarkan beberapa keluarga (tidak ada batasan unik).
- Katering: 1 menu tetap + **cadangan 10%** dari total porsi (dihitung di dashboard).
- Batas tutup pendaftaran **belum ditentukan**; admin bisa membuka/menutup manual dan mengatur batas waktu.
- **Satu QR per pendaftaran** (bukan per orang). QR hanya diberikan bila status *Terdaftar*.

---

## 3. Peta halaman (sitemap)

| URL | Nama | Akses | Pengguna |
|---|---|---|---|
| `/` | Form pendaftaran jemaat/tamu | Publik | Jemaat, tamu |
| `/sukses/[kode]` | Halaman sukses + tiket QR | Publik (siapa pun yang punya kode) | Pendaftar |
| `/pelayan` | Form pendaftaran pelayan | Publik (opsional pakai kode pelayan) | Pelayan |
| `/komsel` | Masuk Gembala Komsel (input kode) | Publik | Gembala Komsel |
| `/komsel/[kode]` | Form banyak keluarga + daftar yang sudah didaftarkan | Berdasarkan kode komsel (KOM-01 s.d. KOM-14) | Gembala Komsel |
| `/admin/login` | Login admin | Publik | Panitia |
| `/admin` | Dashboard admin | Login admin | Panitia |
| `/admin/scan` | Scan QR check-in | Login admin | Panitia di lokasi |
| `/admin/export` | Unduh Excel (.xlsx) | Login admin | Panitia |
| `/admin/export-pdf` | Unduh PDF daftar hadir | Login admin | Panitia |
| `/admin/qr/[kode]` | Gambar QR (PNG) | Login admin | Panitia |

### Alur besar

```
JEMAAT/TAMU  /  → isi form → /sukses/NTL-XXXXXX (QR) → [opsional] kirim kode ke WhatsApp sendiri
PELAYAN      /pelayan → isi form → /sukses/NTL-XXXXXX
GEMBALA      /komsel → masukkan KOM-xx → /komsel/KOM-xx → isi banyak keluarga → daftar di bawah form → kirim WA per keluarga
ADMIN        /admin/login → /admin (pantau, cari, terima/batalkan) → /admin/scan (hari H)
HARI H       Pendaftar tunjukkan QR → admin scan → centang siapa saja yang datang → Check-in
```

---

## 4. Detail tiap halaman

### 4.1 `/` — Form pendaftaran jemaat & tamu (halaman paling penting)

**Struktur dari atas ke bawah:**

1. **Banner** (rasio 4:1, disarankan 1600×400 px) dari `public/banner.jpg`. Disembunyikan otomatis jika file tidak ada. *Saat ini belum ada file banner.*
2. **Kartu judul** (garis merah tebal di atas, gaya Google Form):
   - Nama acara (H1), "GBI ROCK Ubud"
   - Teks pengantar (sambutan)
   - Tabel info: **Waktu** (hari, tanggal, jam WITA) dan **Lokasi** (nama + tautan "Buka di Google Maps")
   - Daftar catatan (5 poin): satu sesi ibadah; pembagian kursi dewasa/anak; nama wajib per orang; tamu boleh daftar; lansia tanpa HP didaftarkan Gembala Komsel
3. **Kondisi pendaftaran** (salah satu):
   - **Ditutup** → kotak merah "Pendaftaran sudah ditutup." (form tidak tampil)
   - **Dibuka** → dua kotak angka **sisa kursi dewasa** dan **sisa kursi anak** (real-time), lalu form
   - Jika salah satu kuota 0 → kotak peringatan kuning: pendaftaran tetap diterima sebagai daftar tunggu
4. **Form** (dua kartu + tombol):
   - **Kartu "Data pendaftar":** Nomor WhatsApp (wajib, validasi langsung) → pilihan **Status** (radio: Jemaat / Tamu) → bila Jemaat, muncul dropdown **Komsel** (wajib)
   - **Kartu "Yang akan hadir":** daftar orang yang bisa ditambah/dihapus (maks. 40). Tiap orang berisi: **Nama** (orang pertama berlabel "Nama Anda (pendaftar)", berikutnya "Nama orang ke-N"), **Gender** (radio L/P), **Kategori usia** (radio Dewasa 13 th+ / Anak 12 th−), tombol **Hapus** (kecuali orang pertama). Tombol **+ Tambah orang** di bawah.
   - Tombol utama **Daftar** (berubah jadi "Mengirim…" dan nonaktif saat proses)
5. **Pesan error** (kotak merah di atas form) bila ada kesalahan dari server.

**Komponen khusus — Input nomor WhatsApp** (dipakai di semua form):
- Hanya angka, harus diawali **08**, 10–13 digit (contoh `081234567890`).
- Teks bantuan abu-abu di bawah kolom: "Hanya angka, diawali 08. Contoh: 081234567890".
- Saat salah format → teks merah + kolom berbingkai merah dengan latar merah muda. Pesan error spesifik (jangan pakai +/spasi/tanda hubung; harus 08 bukan +62; terlalu pendek/panjang).
- Tidak langsung "marah" saat pengguna baru mulai mengetik angka awal yang wajar; baru protes setelah keluar dari kolom.

**Daftar komsel (dropdown):** Bangli 2, Batubulan 7, Batubulan 8, Darmasaba 1, Guwang 1, Guwang 2, Kerta 1, Mas 1, Melinggih 1, Peliatan 1, Peliatan 2, Peliatan 3, Pering 1, Tegalalang 1, Belum Berkomsel, Lainnya.

### 4.2 `/sukses/[kode]` — Halaman sukses & tiket QR

Halaman ini juga berfungsi sebagai **tiket**: pendaftar diminta men-screenshot dan menunjukkannya saat check-in.

- **Badge status** di tengah: hijau "Pendaftaran berhasil" atau kuning "Daftar tunggu".
- **QR code** 220×220 px (hanya jika status Terdaftar; tidak ada untuk daftar tunggu/batal).
- **Kode pendaftaran** besar di tengah (format `NTL-A1B2C3`, huruf besar, jarak antarhuruf lebar).
- Teks penjelas: "Tunjukkan QR ini saat check-in (screenshot halaman ini). Satu QR untuk seluruh rombongan." — atau, untuk daftar tunggu: "Simpan kode ini. QR check-in akan tersedia jika Anda mendapat kursi."
- Kotak peringatan kuning khusus daftar tunggu.
- Tabel ringkas: Acara, Waktu, Nama (perwakilan), jumlah Dewasa, jumlah Anak.
- Daftar **"Yang hadir"**: nama + (kelompok, gender).
- Tombol hijau **"Kirim kode ke WhatsApp saya"** → membuka WhatsApp dengan pesan konfirmasi siap kirim (lihat bagian 5).
- Kondisi error: "Kode pendaftaran tidak ditemukan."

### 4.3 `/pelayan` — Pendaftaran pelayan

- Banner, H1 "Pendaftaran Pelayan", sub "(nama acara) · khusus pelayan ibadah".
- Kotak angka **sisa kursi pelayan**; peringatan daftar tunggu bila 0; kotak "ditutup" bila pendaftaran tutup.
- Form satu kartu: **Kode pelayan** (muncul hanya bila server mengaktifkan kode), **Nama lengkap**, **Gender** (radio), **Nomor WhatsApp**, **Bidang pelayanan** (teks bebas, placeholder "Contoh: Musik, Multimedia, Usher").
- Tombol **Daftar** → diarahkan ke halaman sukses yang sama (4.2).
- Satu orang per pendaftaran; otomatis dikategorikan dewasa.

### 4.4 `/komsel` dan `/komsel/[kode]` — Jalur Gembala Komsel

**Halaman masuk (`/komsel`):** judul "Pendaftaran oleh Gembala Komsel", penjelasan, satu kartu dengan kolom **Kode komsel** (placeholder `KOM-01`, otomatis huruf besar) + tombol Masuk. Error: "Kode tidak valid. Format: KOM-01."

**Halaman kerja (`/komsel/KOM-xx`):**
- Banner, H1 "Komsel (nama komsel)", sub berisi nama acara.
- Kotak kuning sukses setelah submit: "Berhasil mendaftarkan N keluarga. Daftar lengkap ada di bawah."
- **Form:**
  - Kartu "Gembala Komsel": Nomor WhatsApp Gembala (wajib; dipakai sebagai kontak cadangan bagi keluarga tanpa nomor sendiri).
  - Satu atau lebih **blok "Keluarga N"** (latar sedikit berbeda, berbingkai): WhatsApp keluarga (opsional) + daftar orang (nama perwakilan keluarga, gender, kategori usia, tombol hapus orang) + tombol "+ Tambah orang" + tombol "Hapus keluarga ini" (jika lebih dari satu keluarga).
  - Tombol **+ Tambah keluarga** dan tombol utama **Daftarkan semua** (semua keluarga disimpan dalam satu transaksi; bila satu gagal, tidak ada yang tersimpan).
- **Kartu "Sudah didaftarkan (N keluarga)":** per keluarga tampil kode, badge status (Terdaftar/Daftar tunggu), daftar nama + kelompok, dan tombol **"Kirim ke WhatsApp (nomor)"** untuk mengirim konfirmasi secara manual ke keluarga tsb.

### 4.5 `/admin/login`

Satu kolom **kata sandi** bersama (untuk 2–3 admin) + tombol Masuk. Error: "Kata sandi salah." / "ADMIN_PASSWORD belum diisi di .env server." Sesi bertahan 12 jam. Jika sudah login, langsung diarahkan ke `/admin`.

### 4.6 `/admin` — Dashboard admin (layar lebar, maks. 1100 px)

**Header:** judul "Dashboard admin", nama acara; di kanan tombol-tombol kecil: **Check-in**, **Unduh Excel**, **Unduh PDF**, **Keluar**.

**Pesan umpan balik:** kotak merah (error) / kuning (sukses) dari aksi sebelumnya.

**Tiga kartu kuota** (grid responsif): *Kursi dewasa*, *Kursi anak*, *Pelayan* — angka terpakai / kuota + progress bar (hijau; merah saat 100%).

**Kartu Ringkasan** (tabel dua kolom): Pendaftaran terdaftar; Daftar tunggu (jumlah pendaftaran + jumlah orang); Batal; **Konsumsi** = porsi + cadangan 10% = total (ditebalkan); Sudah check-in (orang).

**Pengaturan pendaftaran** (bagian yang bisa dilipat, dengan badge Dibuka/Ditutup di judulnya): checkbox "Pendaftaran dibuka", input tanggal-jam batas akhir (WITA, boleh kosong), tombol Simpan.

**Filter & pencarian:** kolom cari (kode, nama, WA, komsel, atau nama peserta mana pun) + dropdown status (Semua/Terdaftar/Daftar tunggu/Batal) + dropdown kategori (Semua/Jemaat/Tamu/Pelayan) + tombol Cari. Keterangan "X dari Y pendaftaran".

**Tabel pendaftaran** (bisa digulir horizontal di layar sempit), kolom:

| Kolom | Isi |
|---|---|
| Kode | Kode pendaftaran + tanggal/jam daftar |
| Pendaftar | Nama perwakilan (+N bila rombongan) yang bisa dibuka untuk melihat semua anggota; nomor WA. Untuk status Terdaftar, daftar anggota berisi **checkbox check-in per orang** + tombol "Check-in yang dicentang" / "Batalkan check-in" dan badge jam hadir |
| Asal | Komsel / Tamu / Pelayan · bidang; keterangan "via KOM-xx" bila didaftarkan gembala |
| Dewasa / Anak | Jumlah |
| Status | Badge (hijau Terdaftar, kuning lainnya) + "Hadir x/y" |
| Aksi | **WA** (kirim konfirmasi), **Check-in semua**, **QR** (lipat: tampil QR 200 px, Unduh PNG, link Halaman tiket), serta tombol status |

**Aksi ubah status** (per baris):
- Daftar tunggu → **Terima** (dicek kuota) atau **Terima (abaikan kuota)** (keputusan sadar panitia)
- Terdaftar → **Batalkan**
- Batal → **Aktifkan lagi**
- Baris berstatus Batal tampil memudar (opacity ±55%).
- Bila kuota penuh saat "Terima": muncul error "Kuota kategori ini masih penuh. Pakai 'Terima (abaikan kuota)' jika memang disengaja."

### 4.7 `/admin/scan` — Scan check-in (dipakai di HP, hari H)

- Tautan "← Dashboard", judul "Check-in", penjelasan singkat.
- **Penghitung** dua kotak: *sudah hadir* dan *total terdaftar* (muncul setelah scan pertama).
- **Tampilan kamera** (persegi 1:1, latar hitam). Teks status: "Membuka kamera…" atau, jika gagal, "Kamera tidak bisa dipakai. Izinkan akses kamera di browser (butuh HTTPS), atau ketik kode di bawah."
- **Input manual** (cadangan bila QR rusak/kamera gagal): "Atau ketik kode pendaftaran" (placeholder `NTL-A1B2C3`) + tombol Cari. Menerima kode saja atau tautan yang memuat kode.
- **Setelah QR terbaca:** kamera berhenti, tampil kartu hasil:
  - Badge status + kode, **nama pendaftar** (besar), asal (komsel/tamu/pelayan)
  - Jika bukan status Terdaftar → kotak merah (daftar tunggu: "Masih daftar tunggu… Arahkan ke panitia." / batal: "Pendaftaran ini sudah dibatalkan…") dan checkbox dinonaktifkan
  - **Daftar peserta dengan checkbox** (urut dewasa → anak → balita), yang belum hadir otomatis tercentang; yang sudah hadir terkunci + keterangan "hadir 09.12"
  - Tombol **Check-in (N orang)**, **Batalkan check-in** (dengan konfirmasi `confirm()` browser), **Scan berikutnya**
  - Pesan sukses/error di atas kartu
- Pembacaan QR ±6x/detik; ada jeda 1,5 detik setelah pesan error agar sempat terbaca.

### 4.8 Ekspor

**Excel (`pendaftaran-natal-YYYY-MM-DD.xlsx`), 4 sheet:**
1. **Rekap** — kursi terpakai vs kuota, konsumsi (porsi, cadangan 10%, total dipesan), jumlah daftar tunggu
2. **Per Komsel** — jumlah pendaftaran/dewasa/anak per komsel (Tamu dan Pelayan dipisah)
3. **Pendaftaran** — satu baris per pendaftaran
4. **Peserta** — satu baris per orang (nama, gender, kelompok, asal, status, waktu check-in)

**PDF:** kop (nama acara, tanggal, lokasi, waktu ekspor), **Daftar Hadir** (per orang) untuk dicetak/di-check manual, **Daftar Tunggu**, footer "nama acara | Halaman x / y".

*(Ekspor adalah file unduhan; desainer bisa mengabaikan kecuali ingin menyelaraskan tampilan PDF dengan identitas baru.)*

---

## 5. Pesan konfirmasi WhatsApp (manual)

Tidak ada gateway/pihak ketiga. Web hanya menyiapkan **tautan `wa.me`** berisi pesan siap kirim; orang yang mengklik tombol yang mengirimnya sendiri dari WhatsApp-nya. Dipakai di tiga tempat: halaman sukses (pendaftar kirim ke diri sendiri), halaman gembala komsel (kirim ke keluarga), dan dashboard admin (kirim ke pendaftar mana pun).

Isi pesan (pola):
```
Shalom {nama},
pendaftaran di {nama acara} *berhasil*.        (atau: masuk *DAFTAR TUNGGU* …)
Kode: *NTL-XXXXXX*
Waktu: Minggu, 20 Desember 2026 09.00 WITA
Tempat: The Westin Resort & Spa Ubud, Bali
Peta: {tautan Google Maps}
QR check-in: {alamat-situs}/sukses/NTL-XXXXXX     (hanya jika status Terdaftar)
Simpan pesan ini, kode dipakai saat check-in.
GBI ROCK Ubud
```

---

## 6. Inventaris komponen UI saat ini

| Komponen | Keterangan |
|---|---|
| **Kartu (`.card`)** | Putih, border tipis, radius 12 px — pembungkus hampir semua konten |
| **Kartu judul (`.card.judul`)** | Kartu dengan garis atas merah tebal 10 px (gaya header Google Form) |
| **Banner** | Gambar 4:1 di atas halaman publik, hilang otomatis bila tidak ada file |
| **Tombol utama** | Lebar penuh, merah (`#9b1c1c`), teks putih tebal, radius 10 px |
| **Tombol ghost** | Transparan, teks merah, border tipis (Tambah orang, Hapus, dll.) |
| **Tombol link hijau (`a.btn`)** | Hijau, lebar penuh (kirim ke WhatsApp) |
| **Tombol mini** | Kecil untuk tabel/aksi admin |
| **Input teks/tel/select** | Lebar penuh, padding 11 px, radius 8 px, border tipis |
| **Pilihan radio ("choice")** | Radio dalam kotak berbingkai, berjajar & bisa turun baris |
| **Checkbox ("check")** | Checkbox + label (check-in, pengaturan) |
| **Badge** | Pil: hijau (ok/terdaftar), kuning (menunggu/daftar tunggu) |
| **Kotak peringatan** | `.err` (merah), `.note` (kuning) |
| **Kotak kuota (`.quota`)** | Angka besar + keterangan kecil, 2–3 kolom |
| **Kode pendaftaran (`.kode`)** | 1,8 rem, tebal, jarak huruf lebar, rata tengah |
| **Tabel info / tabel data** | Tabel info 2 kolom pada kartu judul; tabel admin dengan header abu-abu kecil |
| **Progress bar kuota** | Tinggi 6 px (dashboard saja) |
| **Blok keluarga (`.fam`)** | Kotak berbingkai di dalam form komsel |
| **Disclosure (`<details>`)** | Dipakai untuk pengaturan, anggota rombongan, QR di tabel |
| **Pemindai kamera** | Kotak 1:1 latar hitam dengan overlay teks status |

**Gaya visual saat ini:** latar krem hangat `#faf7f2`, teks `#1f2430`, aksen merah tua `#9b1c1c` (nuansa Natal), hijau `#166534` untuk status baik, cokelat `#92400e` untuk peringatan, garis `#e5e0d8`. Font **system-ui** (tanpa font kustom). Lebar konten form **maks. 560 px** di tengah; dashboard admin maks. 1100 px. Tidak ada mode gelap, tidak ada logo, tidak ada ikon, tidak ada ilustrasi, hampir tanpa animasi. Banyak gaya inline di komponen.

---

## 7. Status, kondisi, dan state yang perlu didesain

- **Pendaftaran:** Dibuka · Ditutup (manual atau lewat batas waktu) · Kuota dewasa/anak penuh (tetap bisa daftar → daftar tunggu)
- **Status pendaftaran:** Terdaftar · Daftar tunggu · Batal
- **Status check-in:** Belum hadir · Hadir (dengan jam), baik per orang maupun per rombongan (x/y)
- **Tombol kirim:** normal · "Mengirim…" (dinonaktifkan)
- **Validasi:** nomor WA (langsung saat mengetik), nama kosong/terlalu pendek, gender/usia belum dipilih, komsel belum dipilih, jumlah terlalu banyak (maks. 40 per form jemaat, 200 per kiriman komsel)
- **Kosong:** "Belum ada." (daftar komsel kosong), "Acara belum tersedia.", "Kode pendaftaran tidak ditemukan.", "Kode komsel tidak dikenal."
- **Kamera:** membuka · jalan · gagal (izin ditolak / non-HTTPS)
- **Admin:** login salah · sesi habis (diarahkan ke login) · aksi sukses/gagal (banner di atas dashboard)

---

## 8. Catatan untuk redesain

**Yang bisa/boleh diubah bebas:** seluruh tampilan visual (warna, tipografi, ikon, ilustrasi, banner, logo, animasi, tata letak komponen), copywriting yang tidak mengubah aturan, urutan visual elemen, penambahan elemen dekoratif bertema Natal.

**Yang sebaiknya dipertahankan (alur & fungsi):**
- Nama + gender + kategori usia **wajib per orang**.
- Alur kuota → daftar tunggu (tidak ada penolakan).
- Satu QR per pendaftaran, ditampilkan di halaman sukses yang bisa di-screenshot.
- Check-in **per orang** dengan checkbox, bisa dibatalkan.
- Validasi nomor WA format `08…` dengan umpan balik langsung.
- Tombol "Kirim ke WhatsApp" yang manual (tanpa pengiriman otomatis).
- Kode pendaftaran harus mudah dibaca/dibacakan (`NTL-A1B2C3`).

**Prioritas desain yang disarankan:**
1. Form jemaat `/` dan halaman sukses/tiket `/sukses/[kode]` (dilihat semua orang, kebanyakan dari HP).
2. Scan check-in `/admin/scan` (dipakai cepat di lapangan: tombol besar, kontras tinggi, terbaca di bawah terik/ruangan gelap).
3. Form Gembala Komsel (input panjang & berulang — perlu pola yang efisien).
4. Dashboard admin (padat data; desktop-first namun tetap bisa dibuka di HP).
5. Form pelayan & halaman login.

**Pertimbangan aksesibilitas:** target sentuh min. 44 px, kontras teks memadai, ukuran font nyaman bagi pengguna lansia/orang tua, label jelas (jangan hanya placeholder), pesan error yang menyebut cara memperbaiki, grup radio sudah memakai `role="radiogroup"` dan `aria-label` — pertahankan.

**Aset yang dibutuhkan dari desainer / panitia:** banner 1600×400 px (`public/banner.jpg`), logo GBI ROCK Ubud, palet & font yang disetujui, ikon (kamera, WhatsApp, unduh, peta, centang, peringatan), serta ilustrasi/ornamen Natal bila diinginkan.

---

## 9. Pertanyaan terbuka (perlu keputusan panitia/desainer)

1. **Balita (0–4 th):** aturannya tidak mendapat kursi, tetapi form belum menyediakan input balita. Apakah balita perlu dicatat (misalnya kolom "jumlah balita yang ikut, tanpa kursi") atau cukup dijelaskan lewat catatan?
2. Perlu **halaman beranda/landing** yang memilih jalur (Jemaat / Pelayan / Gembala Komsel) atau tetap form langsung di `/`? Saat ini tautan `/pelayan` dan `/komsel` tidak muncul di halaman utama dan dibagikan manual oleh panitia.
3. Apakah ingin **tombol "Simpan QR / Unduh tiket"** (gambar) selain screenshot?
4. Perlu **mode gelap** atau tampilan khusus layar besar untuk dashboard (misal ditampilkan di monitor posko)?
5. Identitas visual: warna merah tua + krem saat ini sementara; apakah ada panduan merek GBI ROCK Ubud?
6. Perlu halaman **tampilan cetak** tiket atau daftar hadir selain PDF yang ada?

---

## 10. Data teks tetap (copywriting) yang tampil

**Pengantar (halaman utama):** "Selamat datang di pendaftaran Natal GBI ROCK Ubud 2026. Silakan isi data diri dan seluruh anggota keluarga atau rombongan yang akan hadir."

**Catatan:**
- Ibadah Natal berlangsung satu sesi.
- Kursi dibatasi dan dibagi untuk dewasa (13 th ke atas) dan anak (12 th ke bawah).
- Setiap orang yang hadir wajib diisi namanya satu per satu.
- Tamu dari luar jemaat boleh mendaftar.
- Jemaat lansia yang tidak memakai HP didaftarkan oleh Gembala Komsel masing-masing.

Teks-teks ini diatur di satu file (`lib/acara.ts`) sehingga mudah diganti tanpa menyentuh tampilan.
