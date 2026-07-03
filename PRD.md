# PRD — tokiq SaaS Platform
**Version:** 1.0.0  
**Status:** Draft  
**Last Updated:** 2026-06-21  
**Author:** Platform Owner

---

## 1. Ringkasan Produk

### 1.1 Visi
tokiq adalah platform POS (Point of Sale) berbasis SaaS yang memungkinkan pemilik UMKM mengakses sistem kasir lengkap dengan satu akun berlangganan tunggal — tanpa biaya per-fitur, tanpa plugin tersembunyi.

### 1.2 Proposisi Nilai
- **Untuk client (owner bisnis):** Satu akun, semua fitur aktif. Mulai dalam 5 menit.
- **Untuk pemilik platform:** Dashboard terpusat untuk kelola subscriber, pantau MRR, dan support client.

### 1.3 Model Bisnis
- **SaaS berbayar** dengan langganan bulanan/tahunan
- Satu paket = akses penuh (tidak ada upsell fitur atau plugin)
- Revenue stream: subscription fee per tenant
- Pemilik platform = Super Admin dengan akses full dashboard

---

## 2. Pengguna & Role

### 2.1 Role Hierarchy

```
Super Admin (Platform Owner)
└── Tenant (Owner Bisnis / Subscriber)
    ├── Manager (opsional, per cabang)
    ├── Kasir (akses transaksi saja)
    └── Staf (akses terbatas sesuai setting)
```

### 2.2 Deskripsi Per Role

| Role | Deskripsi | Akses Kunci |
|------|-----------|-------------|
| **Super Admin** | Pemilik platform tokiq | Semua tenant, billing, laporan MRR |
| **Tenant Owner** | Pemilik bisnis berlangganan | Semua fitur POS untuk bisnis mereka |
| **Manager** | Manajer cabang (opsional) | Laporan cabang, kelola staf cabang |
| **Kasir** | Staff kasir | Transaksi penjualan, lihat produk |
| **Staf Gudang** | Staff stok | Manajemen stok, pembelian supplier |

---

## 3. Scope Fitur

### 3.1 Fitur Platform (Super Admin Dashboard)

#### 3.1.1 Manajemen Tenant
- [ ] Daftar semua subscriber (status aktif/trial/expired/churn)
- [ ] Detail per tenant (paket, tanggal mulai, tanggal expired, jumlah transaksi)
- [ ] Aktifkan / suspend / hapus tenant
- [ ] Reset password tenant
- [ ] Extend trial manual
- [ ] Filter & search tenant

#### 3.1.2 Manajemen Paket & Pricing
- [ ] CRUD paket langganan (nama, harga, durasi, deskripsi)
- [ ] Toggle paket aktif/nonaktif
- [ ] Set harga bulanan vs tahunan
- [ ] Periode trial per paket

#### 3.1.3 Laporan Platform
- [ ] MRR (Monthly Recurring Revenue)
- [ ] Total subscriber aktif
- [ ] Churn rate (bulanan)
- [ ] New subscriber per bulan
- [ ] Grafik pertumbuhan revenue
- [ ] Export laporan ke CSV/Excel

#### 3.1.4 Manajemen Pembayaran (Admin)
- [ ] Riwayat pembayaran semua tenant
- [ ] Status pembayaran (lunas / pending / gagal)
- [ ] Konfirmasi pembayaran manual (untuk transfer bank)
- [ ] Generate invoice

#### 3.1.5 Notifikasi & Broadcast
- [ ] Kirim notifikasi ke semua tenant / tenant tertentu
- [ ] Template notifikasi (email)
- [ ] Pengumuman maintenance

---

### 3.2 Fitur Tenant (Aplikasi POS)

#### 3.2.1 Autentikasi & Onboarding
- [ ] Halaman landing + pricing page
- [ ] Register akun (nama, email, nama toko, jenis bisnis)
- [ ] Verifikasi email
- [ ] Trial 14 hari otomatis setelah register
- [ ] Onboarding wizard (setup toko, tambah produk pertama, atur kasir)
- [ ] Login / logout
- [ ] Lupa password

#### 3.2.2 Dashboard Tenant
- [ ] Ringkasan hari ini (omzet, transaksi, laba)
- [ ] Grafik penjualan 7 hari terakhir
- [ ] Produk terlaris
- [ ] Stok menipis / habis (alert)
- [ ] Shortcut ke menu utama

#### 3.2.3 Modul Transaksi (Kasir)
- [ ] Pilih produk (search, scan barcode, kategori)
- [ ] Keranjang belanja (tambah, kurang, hapus item)
- [ ] Add-on / topping per item
- [ ] Diskon per item / diskon total (nominal/persen)
- [ ] Pajak otomatis
- [ ] Metode pembayaran: tunai, QRIS, transfer
- [ ] Hitung kembalian
- [ ] Shortcut nominal pembayaran
- [ ] Hold transaksi (parkir order)
- [ ] Struk digital (print / WhatsApp / email)
- [ ] Retur transaksi
- [ ] Mode offline (transaksi tetap berjalan, sync saat online)

#### 3.2.4 Manajemen Produk
- [ ] CRUD produk (nama, SKU, harga jual, harga modal, stok)
- [ ] Kategori produk
- [ ] Tipe harga (harga grosir, harga member)
- [ ] Varian produk (ukuran, warna, dll — maks 50 varian)
- [ ] Upload foto produk
- [ ] Import produk via Excel
- [ ] Barcode (manual input / auto-generate)
- [ ] Add-on/topping untuk produk FnB

#### 3.2.5 Manajemen Stok
- [ ] Stok real-time setiap transaksi
- [ ] Stok opname (hitung fisik vs sistem)
- [ ] Pembelian dari supplier (PO)
- [ ] Retur ke supplier
- [ ] Transfer stok antar cabang
- [ ] Notifikasi stok habis / menipis (threshold settable)
- [ ] Laporan arus stok
- [ ] Metode: FIFO / LIFO / Average

#### 3.2.6 Manajemen Pelanggan
- [ ] CRUD data pelanggan
- [ ] Riwayat transaksi per pelanggan
- [ ] Program poin (earn & redeem)
- [ ] Kelompok pelanggan (regular, member, VIP)

#### 3.2.7 Manajemen Supplier
- [ ] CRUD data supplier
- [ ] Riwayat pembelian per supplier
- [ ] Manajemen hutang ke supplier

#### 3.2.8 Shift & Kas
- [ ] Buka shift (input kas awal)
- [ ] Catat pengeluaran kas
- [ ] Catat pemasukan kas
- [ ] Rekap shift (total penjualan, kas masuk/keluar, saldo akhir)
- [ ] Tutup shift
- [ ] Riwayat shift

#### 3.2.9 Laporan Bisnis
- [ ] Laporan penjualan (harian, mingguan, bulanan, custom range)
- [ ] Laporan per kategori produk
- [ ] Laporan laba rugi
- [ ] Laporan arus keuangan
- [ ] Laporan pembelian
- [ ] Laporan hutang & piutang
- [ ] Laporan pajak
- [ ] Laporan kinerja staff (transaksi per kasir)
- [ ] Laporan pengunjung
- [ ] Export semua laporan ke Excel/PDF

#### 3.2.10 Manajemen Cabang
- [ ] CRUD cabang usaha
- [ ] Stok terpisah per cabang
- [ ] Laporan per cabang
- [ ] Konsolidasi laporan semua cabang

#### 3.2.11 Manajemen Staff & Hak Akses
- [ ] CRUD akun staff (minimal 5 akun per tenant, bisa lebih)
- [ ] Role per staff: Kasir, Manajer, Staf Gudang
- [ ] Hak akses granular per menu
- [ ] Pantau aktivitas kasir

#### 3.2.12 Pengaturan Toko
- [ ] Info toko (nama, logo, alamat, no. telepon)
- [ ] Pengaturan struk (header, footer, logo)
- [ ] Pengaturan pajak default
- [ ] Metode akuntansi (FIFO/LIFO/Average)
- [ ] Bahasa aplikasi (Indonesia / English)
- [ ] Printer (thermal USB, Bluetooth, WiFi, EPSON)

#### 3.2.13 Langganan & Billing (Sisi Tenant)
- [ ] Halaman status langganan (paket, expired, usage)
- [ ] Pilih/ganti paket
- [ ] Riwayat pembayaran
- [ ] Upload bukti transfer (jika manual)
- [ ] Notifikasi H-7, H-3, H-1 sebelum expired

---

## 4. Fitur Out of Scope (v1.0)

Fitur-fitur berikut tidak masuk scope v1.0 dan akan dipertimbangkan di iterasi berikutnya:

- PPOB / jual pulsa & token listrik
- E-katalog / toko online (Olshopin)
- Integrasi marketplace (Tokopedia, Shopee)
- Food Menu / QR Menu digital
- Integrasi QRIS otomatis (memakai QRIS statis dulu)
- Mobile App (iOS/Android)
- Absensi staff (StaffPlus)
- Akuntansi terintegrasi

---

## 5. User Stories Prioritas Tinggi

### 5.1 Super Admin
```
US-001: Sebagai Super Admin, saya ingin melihat semua tenant yang berlangganan beserta status 
        mereka agar saya bisa memantau kesehatan bisnis platform saya.

US-002: Sebagai Super Admin, saya ingin mengkonfirmasi pembayaran manual dari tenant 
        agar akun mereka bisa diaktifkan setelah transfer bank dikonfirmasi.

US-003: Sebagai Super Admin, saya ingin melihat grafik MRR dan jumlah subscriber aktif 
        di dashboard agar saya bisa memantau pertumbuhan bisnis.

US-004: Sebagai Super Admin, saya ingin bisa suspend akun tenant yang bermasalah 
        agar saya bisa mengelola platform dengan aman.
```

### 5.2 Tenant Owner
```
US-010: Sebagai Owner, saya ingin mendaftar dan langsung bisa menggunakan aplikasi 
        dalam 5 menit agar saya tidak buang waktu setup yang rumit.

US-011: Sebagai Owner, saya ingin melihat ringkasan omzet hari ini di dashboard 
        agar saya selalu tahu performa bisnis saya.

US-012: Sebagai Owner, saya ingin mengatur hak akses setiap staff 
        agar kasir saya hanya bisa mengakses menu transaksi, bukan laporan keuangan.

US-013: Sebagai Owner, saya ingin mengekspor laporan laba rugi ke Excel 
        agar saya bisa melaporkan keuangan ke akuntan saya.
```

### 5.3 Kasir
```
US-020: Sebagai Kasir, saya ingin mencari produk dengan cepat via search atau barcode 
        agar antrian tidak menumpuk.

US-021: Sebagai Kasir, saya ingin transaksi tetap bisa dilakukan saat internet mati 
        agar bisnis tidak terhenti.

US-022: Sebagai Kasir, saya ingin mengirim struk ke WhatsApp pelanggan 
        agar pelanggan punya bukti transaksi tanpa perlu printer.
```

---

## 6. Alur Bisnis Utama

### 6.1 Alur Registrasi & Onboarding Tenant

```
Landing Page → Pilih Paket → Register (nama, email, toko)
→ Verifikasi Email → Trial 14 Hari Aktif
→ Onboarding Wizard:
   Step 1: Info toko (nama, logo, jenis bisnis)
   Step 2: Tambah kategori & produk pertama
   Step 3: Setup staff pertama (opsional)
   Step 4: Tes transaksi pertama
→ Dashboard Tenant (siap digunakan)
```

### 6.2 Alur Transaksi Kasir

```
Buka Shift (input kas awal)
→ Pilih Produk (search / scan barcode / tap kategori)
→ Keranjang (atur qty, diskon, add-on)
→ Pilih Metode Bayar (tunai / QRIS / transfer)
→ Input nominal bayar → Hitung kembalian
→ Konfirmasi → Stok otomatis berkurang
→ Cetak / kirim struk
→ [Ulangi untuk transaksi berikutnya]
→ Tutup Shift → Rekap kas → Laporan shift
```

### 6.3 Alur Pembayaran Langganan

```
Notifikasi H-7 (email) → Tenant buka halaman billing
→ Pilih paket (lanjut / upgrade)
→ Pilih metode bayar (transfer bank)
→ Upload bukti transfer
→ Super Admin konfirmasi di dashboard
→ Langganan diperpanjang otomatis
→ Notifikasi konfirmasi ke tenant (email)
```

### 6.4 Alur Manajemen Stok

```
Produk baru → Input stok awal
→ Setiap transaksi → Stok berkurang otomatis
→ Stok < threshold → Notifikasi alert
→ PO ke supplier → Barang datang → Stok bertambah
→ Stok opname berkala → Adjust selisih
```

---

## 7. Persyaratan Non-Fungsional

### 7.1 Performa
- Halaman utama load < 2 detik (LCP)
- Transaksi kasir response < 500ms
- Laporan dengan data 10.000+ transaksi load < 5 detik

### 7.2 Ketersediaan
- Uptime target: 99.5% per bulan
- Mode offline: transaksi tetap berjalan tanpa internet
- Auto-sync saat kembali online

### 7.3 Keamanan
- Authentication via Supabase Auth (JWT)
- Row Level Security (RLS) Supabase — data tenant terisolasi per tenant_id
- Password hashing via bcrypt (handled Supabase)
- HTTPS wajib
- Input sanitization & Zod validation di semua form
- Rate limiting di endpoint auth

### 7.4 Skalabilitas
- Multi-tenant: setiap tenant data terisolasi (tenant_id di setiap tabel)
- Database: Supabase Postgres dengan RLS
- CDN untuk aset statis

### 7.5 Aksesibilitas
- WCAG 2.1 Level AA
- Keyboard navigable
- Screen reader compatible (Radix UI primitives)

---

## 8. Metrik Keberhasilan (KPI)

| Metrik | Target 3 Bulan | Target 6 Bulan |
|--------|----------------|----------------|
| Tenant aktif | 50 | 200 |
| MRR | Rp 5 juta | Rp 25 juta |
| Churn rate | < 10%/bulan | < 7%/bulan |
| Onboarding completion rate | > 70% | > 80% |
| NPS Score | > 40 | > 50 |
| Uptime | 99.5% | 99.9% |

---

## 9. Prioritas Pengembangan (Roadmap)

### Phase 1 — Foundation (Minggu 1–4)
- Setup project, database schema, auth
- Super Admin: dashboard + manajemen tenant
- Tenant: auth, onboarding, manajemen produk

### Phase 2 — Core POS (Minggu 5–8)
- Modul transaksi kasir lengkap
- Manajemen stok
- Shift & kas
- Laporan dasar

### Phase 3 — Business Features (Minggu 9–12)
- Manajemen pelanggan & poin
- Multi-cabang
- Manajemen staff & hak akses
- Laporan lengkap + export

### Phase 4 — Billing & Polish (Minggu 13–16)
- Sistem langganan & billing
- Notifikasi email (Resend)
- Offline mode (PWA)
- Performance optimization
- Testing & QA

---

## 10. Asumsi & Risiko

### Asumsi
- Target pasar utama: UMKM Indonesia (warung, minimarket, FnB, salon, laundry)
- Pembayaran awal via transfer bank manual (Midtrans/Xendit bisa ditambah di v2)
- Koneksi internet diperlukan untuk sync, tidak untuk transaksi

### Risiko
| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Offline sync conflict | Tinggi | Optimistic locking + conflict resolution strategy |
| Tenant data leakage | Kritis | RLS Supabase wajib di semua tabel |
| Churn tinggi di bulan 1 | Tinggi | Onboarding wizard + in-app guidance |
| Skalabilitas database | Medium | Index query kritis, connection pooling |
