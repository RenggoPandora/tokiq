# FIXES & FEATURE TRACKER — tokiq

> Dokumen ini mencatat semua fitur baru dan bug fix yang dikerjakan setelah proyek live.
> Update dokumen ini setiap kali ada fitur baru atau fix yang selesai dikerjakan.
> Gunakan checklist testing untuk log manual QA.

---

## Cara Pakai Dokumen Ini

- **Status fitur:** `🔄 In Progress` / `✅ Done` / `⏳ Planned`
- **Testing:** centang `[x]` untuk test case yang sudah dijalankan
- **Setiap fitur baru** → tambah section baru dengan format yang sama
- **Setiap bug fix** → tambah di section "Bug Fixes" dengan nomor urut

---

## Daftar Fitur

| No | Fitur | Status | Tanggal |
|----|-------|--------|---------|
| F-001 | Staff Login — Owner buat akun staff dengan email+password | 🔄 In Progress | 2026-07-04 |

---

## Daftar Bug Fix

| No | Bug | Status | Tanggal |
|----|-----|--------|---------|
| B-001 | Login page: `Cannot update component while rendering` | ✅ Done | 2026-07-04 |
| B-002 | Register 500 error — Supabase SMTP limit | ✅ Done | 2026-07-04 |
| B-003 | `useTenant` crash setelah login — tenant belum dibuat | ✅ Done | 2026-07-04 |
| B-004 | RLS `infinite recursion` di `tenant_users` | ✅ Done | 2026-07-04 |
| B-005 | Onboarding 403 — policy INSERT belum ada | ✅ Done | 2026-07-04 |
| B-006 | Super Admin tidak bisa lihat data tenant | ✅ Done | 2026-07-04 |
| B-007 | Dropdown "Lihat Detail" tenant tidak navigate | ✅ Done | 2026-07-04 |

---

---

# F-001 — Staff Login

**Status:** 🔄 In Progress  
**Tanggal mulai:** 2026-07-04

## Latar Belakang

Saat ini owner bisa menambahkan staff (manager, kasir, warehouse) lewat halaman `/app/staff`. Tapi staff yang ditambahkan tidak bisa login — karena hanya disimpan di `tenant_users` tanpa akun Supabase Auth.

## Solusi yang Dipilih

Owner mengisi **email + password** saat membuat staff. Sistem akan:
1. Membuat akun Supabase Auth untuk staff (`supabase.auth.admin.signUp`)
2. Menyimpan record di `tenant_users` dengan `user_id` yang terhubung

Staff kemudian login di **halaman `/login` yang sama** dengan owner — tidak perlu halaman terpisah. Setelah login, sistem mendeteksi role dan mengarahkan ke dashboard yang sesuai.

## Alur Login Staff

```
Staff buka /login → isi email + password
        ↓
Supabase Auth verifikasi
        ↓
loadAuthUser() → cari tenant_users WHERE user_id = auth.uid()
        ↓
tenantId ditemukan → redirect ke /app/dashboard
        ↓
useTenant() → role = 'manager' / 'cashier' / 'warehouse'
        ↓
TenantSidebar render menu sesuai permission role
```

## Perubahan yang Dibutuhkan

### Backend (Supabase)
- [ ] Buat Supabase Edge Function `create-staff-user` yang memanggil `auth.admin.createUser()` (butuh service role key — tidak bisa dari client)
- [ ] Atau: gunakan workaround dengan `supabase.auth.signUp()` dari client langsung

### Frontend
- [ ] Update form staff di `app/staff.tsx` — tambah field `email` dan `password`
- [ ] Update `staff.service.ts` — `create()` sekaligus buat auth user
- [ ] Update `auth.context.tsx` — `loadAuthUser()` sudah handle staff (sudah ada)
- [ ] Update `login.tsx` — redirect staff ke `/app/dashboard` (sudah handle via `tenantId`)
- [ ] Update `app.tsx` layout — sudah ada guard untuk cek `tenantId`

## Approach Tanpa Edge Function

Karena Edge Function butuh deployment tambahan, gunakan pendekatan sederhana:

**Owner buat akun staff → staff aktifkan sendiri**

1. Owner isi email staff di form
2. Sistem kirim invite email via `supabase.auth.signInWithOtp()` atau `signUp()` biasa
3. Staff terima email → klik link → set password → login

Atau lebih simpel: **Owner isi email + password staff langsung**, lalu sistem pakai `supabase.auth.signUp()` — ini works tapi password dibuat owner, bukan staff.

**Keputusan: Pakai `signUp()` dari client — owner set email+password staff.**

---

## Testing Checklist — F-001

### Persiapan
- [ ] Dev server berjalan (`npm run dev`)
- [ ] Login sebagai tenant owner
- [ ] Buka halaman `/app/staff`

### Test 1: Tambah Staff dengan Email + Password Baru

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 1.1 | Klik "Tambah Staff" | Form terbuka dengan field: Nama, Email, Password, Role | ⬜ |
| 1.2 | Isi Nama: "Budi Kasir", Email: baru, Password: min 8 karakter, Role: Kasir | Form valid, tidak ada error merah | ⬜ |
| 1.3 | Klik "Tambahkan" | Loading spinner muncul, lalu toast "Staff berhasil ditambahkan" | ⬜ |
| 1.4 | Cek list staff | Staff "Budi Kasir" muncul di tabel dengan role "Kasir" | ⬜ |
| 1.5 | Cek Supabase Dashboard → Auth → Users | Email staff muncul sebagai user baru | ⬜ |

### Test 2: Validasi Form

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 2.1 | Submit form kosong | Error validasi muncul di semua field yang wajib | ⬜ |
| 2.2 | Email tidak valid (format salah) | Error "Email tidak valid" | ⬜ |
| 2.3 | Password kurang dari 8 karakter | Error "Password minimal 8 karakter" | ⬜ |
| 2.4 | Email sudah terdaftar | Toast error dari Supabase "User already registered" | ⬜ |

### Test 3: Staff Login

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 3.1 | Logout dari akun owner | Redirect ke `/login` | ⬜ |
| 3.2 | Login dengan email+password staff yang baru dibuat | Login berhasil | ⬜ |
| 3.3 | Setelah login, redirect ke mana? | Harusnya ke `/app/dashboard` (bukan onboarding) | ⬜ |
| 3.4 | Buka sidebar | Menu yang tampil sesuai role staff (kasir hanya lihat POS) | ⬜ |
| 3.5 | Akses `/admin` sebagai staff | Redirect ke `/app/dashboard` (tidak bisa akses admin) | ⬜ |

### Test 4: Permission Role

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 4.1 | Login sebagai Kasir — akses `/app/pos` | Bisa akses | ⬜ |
| 4.2 | Login sebagai Kasir — akses `/app/reports` | Tidak tampil di sidebar | ⬜ |
| 4.3 | Login sebagai Manager — akses `/app/reports` | Bisa akses | ⬜ |
| 4.4 | Login sebagai Manager — akses `/app/staff` | Tidak bisa (hanya owner) | ⬜ |

### Test 5: Edge Cases

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 5.1 | Owner nonaktifkan staff (`is_active = false`) | Staff yang login dengan akun tsb tidak bisa masuk ke `/app` | ⬜ |
| 5.2 | Hapus staff dari list | Record di `tenant_users` terhapus, akun Auth tetap ada (tidak delete auth user) | ⬜ |
| 5.3 | Staff dari tenant A coba akses data tenant B | RLS memblokir — data tidak muncul | ⬜ |

---

---

# Bug Fixes Log

## B-001 — Login page setState in render
**Fix:** Pindahkan `navigate()` ke dalam `useEffect` agar tidak dipanggil saat render.  
**File:** `src/routes/login.tsx`  
**Status:** ✅ Done

## B-002 — Register 500 error
**Fix:** Nonaktifkan "Confirm email" di Supabase Dashboard → Auth → Providers → Email sementara untuk development.  
**Status:** ✅ Done

## B-003 — useTenant crash setelah login
**Fix:** Guard di `app.tsx` layout — redirect ke `/onboarding` jika `authUser.tenantId` null.  
**File:** `src/routes/app.tsx`  
**Status:** ✅ Done

## B-004 — RLS infinite recursion di tenant_users
**Fix:** Update `get_user_tenant_id()` dengan `SET row_security = off` di SQL function.  
**SQL:** `SET row_security = off` di body fungsi  
**Status:** ✅ Done

## B-005 — Onboarding 403 forbidden
**Fix:** Tambah policy INSERT untuk `tenants`, `branches`, `tenant_users` yang mengizinkan user baru saat belum punya `tenant_id`.  
**SQL:** Policy dengan fallback `tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid())`  
**Status:** ✅ Done

## B-006 — Super Admin tidak bisa lihat data tenant
**Fix:** Buat fungsi `is_super_admin()` yang hardcode email super admin, tambah ke policy SELECT di `tenants` dan `invoices`.  
**SQL:** Fungsi `is_super_admin()` + update policy `tenants_select`  
**Status:** ✅ Done

## B-007 — Dropdown "Lihat Detail" tidak navigate
**Fix:** Ganti `DropdownMenuItem asChild + Link` dengan `DropdownMenuItem onClick + useNavigate` — Radix dropdown interrupt navigasi saat menggunakan asChild pattern.  
**File:** `src/routes/admin/tenants.tsx`  
**Status:** ✅ Done
