# Role & Permission Matrix — tokiq

> Dokumen ini menjelaskan permission dan akses setiap role di sistem tokiq.
> Terakhir update: 2026-07-12

---

## Overview

Sistem tokiq memiliki 4 role utama untuk tenant user:

| Role | Level | Fokus Kerja |
|------|-------|-------------|
| **Owner** | Tertinggi | Full access — manage seluruh bisnis |
| **Manager** | Tinggi | Operasional harian — kecuali staff & billing |
| **Kasir** | Menengah | Transaksi penjualan & customer service |
| **Warehouse** | Menengah | Inventory & supplier management |

---

## 👑 Owner (Pemilik Bisnis)

**Deskripsi:** Pemilik bisnis dengan akses penuh ke seluruh sistem.

### Akses Menu

✅ **Dashboard** — Overview bisnis (sales, profit, top products)  
✅ **Kasir (POS)** — Transaksi penjualan  
✅ **Produk** — Lihat & kelola produk (tambah/edit/hapus)  
✅ **Kategori** — Kelola kategori produk  
✅ **Stok** — Lihat & kelola stok (stock opname, adjustment)  
✅ **Pelanggan** — Lihat & kelola data pelanggan  
✅ **Supplier** — Kelola data supplier  
✅ **Laporan** — Lihat & export laporan (sales, inventory, profit)  
✅ **Staff** — Kelola staff (tambah/edit/hapus/nonaktifkan)  
✅ **Cabang** — Kelola cabang bisnis  
✅ **Langganan** — Kelola billing & subscription  
✅ **Pengaturan** — Setting bisnis (tax, receipt, notifications)  

### Permissions

```
pos.access
products.view
products.manage
categories.manage
stock.view
stock.manage
customers.view
customers.manage
suppliers.manage
reports.view
reports.export
staff.manage
branches.manage
settings.manage
billing.view
```

### Use Case

- Setup awal bisnis (onboarding)
- Tambah/kelola staff dan cabang
- Monitor performa bisnis lewat laporan
- Setting kebijakan harga, pajak, diskon
- Upgrade/downgrade subscription

---

## 📊 Manager (Manajer)

**Deskripsi:** Supervise operasional harian — bisa kelola inventory, produk, dan laporan. Tidak bisa kelola staff atau billing.

### Akses Menu

✅ **Dashboard** — Overview bisnis  
✅ **Kasir (POS)** — Transaksi penjualan  
✅ **Produk** — Lihat & kelola produk (tambah/edit/hapus)  
✅ **Kategori** — Kelola kategori produk  
✅ **Stok** — Lihat & kelola stok (stock opname, adjustment)  
✅ **Pelanggan** — Lihat & kelola data pelanggan  
✅ **Supplier** — Kelola data supplier  
✅ **Laporan** — Lihat & export laporan  
❌ **Staff** — Tidak akses (hanya owner)  
❌ **Cabang** — Tidak akses (hanya owner)  
❌ **Langganan** — Tidak akses (hanya owner)  
❌ **Pengaturan** — Tidak akses (hanya owner)  

### Permissions

```
pos.access
products.view
products.manage
categories.manage
stock.view
stock.manage
customers.view
customers.manage
suppliers.manage
reports.view
reports.export
```

### Use Case

- Supervise kasir dan operasional harian
- Kelola inventory (stock opname, reorder)
- Koordinasi dengan supplier
- Generate & review laporan penjualan
- Handle customer complaints

---

## 💵 Kasir (Cashier)

**Deskripsi:** Fokus transaksi penjualan di POS. Akses read-only untuk produk, stok, dan pelanggan.

### Akses Menu

✅ **Dashboard** — Overview bisnis (read-only)  
✅ **Kasir (POS)** — Transaksi penjualan (FITUR UTAMA)  
✅ **Produk** — Lihat produk (tidak bisa edit)  
✅ **Stok** — Lihat stok (tidak bisa edit)  
✅ **Pelanggan** — Lihat pelanggan (tidak bisa edit)  
❌ **Kategori** — Tidak akses  
❌ **Supplier** — Tidak akses  
❌ **Laporan** — Tidak akses  
❌ **Staff** — Tidak akses  
❌ **Cabang** — Tidak akses  
❌ **Langganan** — Tidak akses  
❌ **Pengaturan** — Tidak akses  

### Permissions

```
pos.access
products.view
stock.view
customers.view
```

### Use Case

- Proses transaksi penjualan
- Cek stok produk sebelum jual
- Cari data pelanggan (untuk member/loyalty)
- Print receipt

### Catatan

- Kasir **tidak bisa** ubah harga produk (harus lewat manager/owner)
- Kasir **tidak bisa** lihat laporan profit (hanya bisa transaksi)
- PIN kasir digunakan untuk quick login di POS terminal (future)

---

## 📦 Warehouse (Gudang)

**Deskripsi:** Fokus kelola inventory dan koordinasi supplier. Tidak bisa akses POS atau customer.

### Akses Menu

✅ **Dashboard** — Overview bisnis (read-only)  
✅ **Produk** — Lihat produk (tidak bisa edit harga/kategori)  
✅ **Stok** — Lihat & kelola stok (FITUR UTAMA: stock in/out, opname)  
✅ **Supplier** — Kelola data supplier  
❌ **Kasir (POS)** — Tidak akses  
❌ **Kategori** — Tidak akses  
❌ **Pelanggan** — Tidak akses  
❌ **Laporan** — Tidak akses  
❌ **Staff** — Tidak akses  
❌ **Cabang** — Tidak akses  
❌ **Langganan** — Tidak akses  
❌ **Pengaturan** — Tidak akses  

### Permissions

```
products.view
stock.view
stock.manage
suppliers.manage
```

### Use Case

- Terima barang dari supplier
- Stock opname & adjustment
- Monitoring stok menipis (reorder alert)
- Update data supplier (kontak, payment term)

### Catatan

- Warehouse **bisa** tambah/edit stok tapi **tidak bisa** ubah harga jual
- Warehouse **tidak bisa** akses POS (supaya fokus inventory)

---

## 🎯 Permission Matrix (Tabel Ringkasan)

| Fitur | Owner | Manager | Kasir | Warehouse |
|-------|:-----:|:-------:|:-----:|:---------:|
| **Dashboard** | ✅ | ✅ | ✅ (read) | ✅ (read) |
| **Kasir (POS)** | ✅ | ✅ | ✅ | ❌ |
| **Produk - View** | ✅ | ✅ | ✅ | ✅ |
| **Produk - Manage** | ✅ | ✅ | ❌ | ❌ |
| **Kategori** | ✅ | ✅ | ❌ | ❌ |
| **Stok - View** | ✅ | ✅ | ✅ | ✅ |
| **Stok - Manage** | ✅ | ✅ | ❌ | ✅ |
| **Pelanggan - View** | ✅ | ✅ | ✅ | ❌ |
| **Pelanggan - Manage** | ✅ | ✅ | ❌ | ❌ |
| **Supplier** | ✅ | ✅ | ❌ | ✅ |
| **Laporan** | ✅ | ✅ | ❌ | ❌ |
| **Staff** | ✅ | ❌ | ❌ | ❌ |
| **Cabang** | ✅ | ❌ | ❌ | ❌ |
| **Langganan** | ✅ | ❌ | ❌ | ❌ |
| **Pengaturan** | ✅ | ❌ | ❌ | ❌ |

---

## 🔐 Implementasi Teknis

### File Terkait

- **Permission Logic:** `src/hooks/use-permissions.ts`
- **Sidebar Navigation:** `src/components/layouts/tenant-sidebar.tsx`
- **Role Constants:** `src/lib/constants.ts`

### Cara Kerja

1. **Login** → Supabase Auth verifikasi user
2. **Load Profile** → `auth.context.tsx` query `tenant_users` untuk dapat `role`
3. **Check Permission** → `usePermissions()` cek role + custom permissions
4. **Render Menu** → Sidebar hanya tampilkan menu dengan permission

### Custom Permissions (Future)

Owner bisa override permission individual staff via field `permissions` di `tenant_users`:

```json
{
  "permissions": {
    "reports.view": true,  // Kasir bisa lihat laporan (exception)
    "pos.access": false    // Manager tidak bisa akses POS (restriction)
  }
}
```

Prioritas: **Custom Permissions** > **Default Role Permissions**

---

## 📝 Catatan & Best Practices

### Security

- ✅ RLS (Row Level Security) di Supabase enforce tenant isolation
- ✅ Staff tidak bisa akses data tenant lain (by `tenant_id`)
- ✅ Nonaktifkan staff (`is_active = false`) → logout otomatis

### Onboarding Staff

1. Owner tambah staff di `/app/staff` dengan email+password
2. Staff login di `/login` dengan credentials yang dibuat owner
3. Sistem deteksi role → redirect ke dashboard
4. Sidebar auto-filter menu sesuai permission

### Role Hierarchy

```
Owner (Level 4) — Full control
  ↓
Manager (Level 3) — Operational management
  ↓
Kasir / Warehouse (Level 2) — Task-specific
```

### FAQ

**Q: Kasir bisa void/refund transaksi?**  
A: Belum ada permission `pos.void` — saat ini semua role dengan `pos.access` bisa void (future: bisa dibatasi)

**Q: Manager bisa tambah staff?**  
A: Tidak. Hanya owner yang punya permission `staff.manage`

**Q: Warehouse bisa ubah harga produk?**  
A: Tidak. Warehouse hanya `products.view`, tidak ada `products.manage`

**Q: Bisa bikin custom role baru?**  
A: Belum support. Saat ini fix 4 role. Custom role bisa jadi future feature.

---

## 🚀 Roadmap Permission

### Planned Features

- [ ] Custom permission override per staff (via UI)
- [ ] Permission `pos.void` & `pos.discount` untuk kontrol lebih granular
- [ ] Audit log untuk action sensitif (delete, void, discount besar)
- [ ] Multi-branch permission (staff hanya akses cabang tertentu)
- [ ] Custom role definition (beyond 4 default roles)

---

**Terakhir update:** 2026-07-12  
**Versi dokumen:** 1.0  
**Untuk pertanyaan:** Hubungi owner atau check `FIXES.md` untuk update fitur
