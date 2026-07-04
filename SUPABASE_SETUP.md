# Panduan Setup Supabase — tokiq

Dokumen ini memandu kamu dari zero hingga Supabase siap digunakan oleh aplikasi tokiq, termasuk schema database, RLS, auth, storage, dan database function yang dibutuhkan.

---

## Daftar Isi

1. [Buat Project Supabase](#1-buat-project-supabase)
2. [Konfigurasi Auth](#2-konfigurasi-auth)
3. [Jalankan Migrations](#3-jalankan-migrations)
4. [Database Function Tambahan](#4-database-function-tambahan)
5. [Setup Storage Bucket](#5-setup-storage-bucket)
6. [Hubungkan ke Aplikasi](#6-hubungkan-ke-aplikasi)
7. [Set Super Admin](#7-set-super-admin)
8. [Verifikasi Setup](#8-verifikasi-setup)
9. [Setup untuk Development Lokal](#9-setup-untuk-development-lokal)
10. [Checklist Sebelum Production](#10-checklist-sebelum-production)

---

## 1. Buat Project Supabase

### 1.1 Daftar / Login

Buka [supabase.com](https://supabase.com) → klik **New Project**.

### 1.2 Isi detail project

| Field | Nilai |
|-------|-------|
| **Organization** | Pilih org atau buat baru |
| **Project name** | `tokiq` (atau `tokiq-production`) |
| **Database password** | Generate password kuat, **simpan di tempat aman** |
| **Region** | `Southeast Asia (Singapore)` — paling dekat ke Indonesia |
| **Pricing plan** | Free tier cukup untuk development; Pro untuk production |

Tunggu 2–3 menit sampai project siap.

---

## 2. Konfigurasi Auth

### 2.1 Email Provider

Pergi ke **Authentication → Providers → Email**.

Aktifkan pengaturan berikut:

```
✅ Enable Email provider         → ON
✅ Confirm email                 → ON  (wajib untuk verifikasi email)
☐  Enable email signup           → ON
☐  Secure email change           → ON
```

### 2.2 URL Configuration

Pergi ke **Authentication → URL Configuration**.

| Setting | Nilai |
|---------|-------|
| **Site URL** | `http://localhost:5173` (dev) / `https://tokiq.id` (prod) |
| **Redirect URLs** | Tambahkan semua URL berikut: |

```
http://localhost:5173/**
http://localhost:5173/verify-email
http://localhost:5173/onboarding
http://localhost:5173/reset-password
https://tokiq.id/**
https://tokiq.id/verify-email
https://tokiq.id/onboarding
https://tokiq.id/reset-password
```

### 2.3 Email Templates

Pergi ke **Authentication → Email Templates**.

#### Template: Confirm signup

Subject:
```
Konfirmasi email tokiq kamu
```

Body (HTML — ganti yang default):
```html
<h2>Selamat datang di tokiq!</h2>
<p>Terima kasih sudah mendaftar. Klik tombol di bawah untuk mengaktifkan akunmu.</p>
<p><a href="{{ .ConfirmationURL }}" style="background:#000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Aktifkan Akun</a></p>
<p>Link ini berlaku selama 24 jam.</p>
<p>Jika kamu tidak mendaftar di tokiq, abaikan email ini.</p>
```

#### Template: Reset password

Subject:
```
Reset password tokiq kamu
```

Body:
```html
<h2>Reset Password</h2>
<p>Kamu meminta reset password untuk akun tokiq kamu.</p>
<p><a href="{{ .ConfirmationURL }}" style="background:#000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Reset Password</a></p>
<p>Link ini berlaku selama 1 jam.</p>
<p>Jika kamu tidak meminta reset password, abaikan email ini.</p>
```

---

## 3. Jalankan Migrations

Semua SQL ada di folder `supabase/migrations/`. Jalankan secara berurutan via **SQL Editor** di dashboard.

Buka **SQL Editor → New query** → paste SQL → klik **Run**.

### 3.1 Migration 1 — Schema

Buka dan jalankan file: `supabase/migrations/001_init_schema.sql`

File ini membuat semua tabel:
- `subscription_plans`, `tenants`, `invoices`
- `branches`, `tenant_users`, `categories`, `products`
- `product_variants`, `product_addons`, `product_prices`
- `stocks`, `stock_movements`, `suppliers`, `purchases`, `purchase_items`
- `customers`, `shifts`, `cash_movements`
- `transactions`, `transaction_items`, `discounts`

Cek apakah sukses — tidak ada error merah di output.

### 3.2 Migration 2 — RLS Policies

Jalankan: `supabase/migrations/002_rls_policies.sql`

File ini:
- Mengaktifkan RLS di semua tabel
- Membuat fungsi helper `get_user_tenant_id()`
- Membuat policies untuk isolasi data per tenant

### 3.3 Migration 3 — Seed Plans

Jalankan: `supabase/migrations/003_seed_plans.sql`

File ini mengisi 2 paket awal: **Starter** (Rp 149.000/bln) dan **Pro** (Rp 299.000/bln).

---

## 4. Database Function Tambahan

Buka **SQL Editor → New query** dan jalankan SQL berikut satu per satu.

### 4.1 Fungsi Decrement Stok (dibutuhkan POS)

Fungsi ini dipanggil setiap kali ada transaksi untuk mengurangi stok.

```sql
CREATE OR REPLACE FUNCTION decrement_stock(
  p_tenant_id UUID,
  p_branch_id UUID,
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stocks
  SET 
    quantity = GREATEST(0, quantity - p_quantity),
    updated_at = NOW()
  WHERE 
    tenant_id = p_tenant_id
    AND branch_id = p_branch_id
    AND product_id = p_product_id
    AND (
      (p_variant_id IS NULL AND variant_id IS NULL)
      OR variant_id = p_variant_id
    );

  -- Kalau row belum ada, buat dengan quantity 0
  IF NOT FOUND THEN
    INSERT INTO stocks (tenant_id, branch_id, product_id, variant_id, quantity)
    VALUES (p_tenant_id, p_branch_id, p_product_id, p_variant_id, 0)
    ON CONFLICT (product_id, variant_id, branch_id) DO NOTHING;
  END IF;
END;
$$;
```

### 4.2 Fungsi Upsert Stok (untuk stok opname) (4.3 dulu)

```sql
CREATE OR REPLACE FUNCTION upsert_stock(
  p_tenant_id  UUID,
  p_branch_id  UUID,
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity   INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_variant_id IS NOT NULL THEN
    INSERT INTO stocks (tenant_id, branch_id, product_id, variant_id, quantity, updated_at)
    VALUES (p_tenant_id, p_branch_id, p_product_id, p_variant_id, p_quantity, NOW())
    ON CONFLICT ON CONSTRAINT stocks_unique_with_variant
    DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW();
  ELSE
    INSERT INTO stocks (tenant_id, branch_id, product_id, variant_id, quantity, updated_at)
    VALUES (p_tenant_id, p_branch_id, p_product_id, NULL, p_quantity, NOW())
    ON CONFLICT ON CONSTRAINT stocks_unique_without_variant
    DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW();
  END IF;
END;
$$;

```

### 4.3 Perbaiki UNIQUE constraint untuk variant NULL

Supabase Postgres memerlukan partial index untuk handle NULL pada UNIQUE constraint:

```sql
-- Drop constraint lama jika ada
ALTER TABLE stocks DROP CONSTRAINT IF EXISTS stocks_product_id_variant_id_branch_id_key;

-- Buat dua partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS stocks_unique_with_variant
  ON stocks (product_id, variant_id, branch_id)
  WHERE variant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS stocks_unique_without_variant
  ON stocks (product_id, branch_id)
  WHERE variant_id IS NULL;
```

### 4.4 Trigger: Auto-update `updated_at`

```sql
-- Fungsi trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Terapkan ke tabel yang butuh auto-update
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 4.5 RLS Bypass untuk Super Admin via Service Role

Tambahkan policy yang mengizinkan akses penuh menggunakan service role key (digunakan di Edge Functions):

```sql
-- Super Admin bypass — hanya berlaku untuk service_role
-- (service_role key TIDAK pernah di-expose ke client)

CREATE POLICY "Service role bypass on tenants" ON tenants
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role bypass on invoices" ON invoices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role bypass on subscription_plans" ON subscription_plans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

## 5. Setup Storage Bucket

Pergi ke **Storage → New bucket**.

### 5.1 Bucket: product-images

| Setting | Nilai |
|---------|-------|
| **Name** | `product-images` |
| **Public bucket** | ✅ ON (supaya gambar bisa ditampilkan di kasir) |
| **File size limit** | `5 MB` |
| **Allowed MIME types** | `image/jpeg, image/png, image/webp` |

**Storage Policy** — setelah buat bucket, buka **Policies → Add policy**:

```sql
-- INSERT: Hanya authenticated user yang bisa upload
CREATE POLICY "Authenticated can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- SELECT: Siapapun bisa lihat (karena public)
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- DELETE: Hanya authenticated user yang bisa hapus
CREATE POLICY "Authenticated can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
```

### 5.2 Bucket: payment-proofs

Bucket untuk upload bukti transfer dari tenant.

| Setting | Nilai |
|---------|-------|
| **Name** | `payment-proofs` |
| **Public bucket** | ❌ OFF (private, hanya admin yang bisa lihat) |
| **File size limit** | `10 MB` |
| **Allowed MIME types** | `image/jpeg, image/png, application/pdf` |

```sql
-- INSERT: Tenant bisa upload bukti bayar mereka sendiri
CREATE POLICY "Tenant can upload payment proof"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

-- SELECT: Hanya authenticated (admin akan pakai service role)
CREATE POLICY "Authenticated can view payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-proofs');
```

### 5.3 Bucket: tenant-logos

| Setting | Nilai |
|---------|-------|
| **Name** | `tenant-logos` |
| **Public bucket** | ✅ ON |
| **File size limit** | `2 MB` |
| **Allowed MIME types** | `image/jpeg, image/png, image/webp, image/svg+xml` |

---

## 6. Hubungkan ke Aplikasi

### 6.1 Ambil API Keys

Pergi ke **Project Settings → API**.

Salin:
- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public key** → `VITE_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (**JANGAN masukkan ke client!**)

### 6.2 Isi `.env.local`

Buat file `.env.local` di root project (salin dari `.env.example`):

```bash
# Supabase
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# Super Admin — email yang akan jadi Super Admin
VITE_SUPER_ADMIN_EMAIL=admin@tokiq.id

# Untuk Edge Functions saja (tidak dipakai di client)
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
# RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
# APP_URL=https://tokiq.id
```

> ⚠️ **PENTING:** Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY` di variabel yang prefix `VITE_`. Variabel `VITE_` akan ter-expose ke browser.

### 6.3 Test koneksi

Jalankan dev server:

```bash
npm run dev
```

Buka browser ke `http://localhost:5173`. Kalau landing page muncul tanpa error di console, koneksi berhasil.

---

## 7. Set Super Admin

Super Admin adalah akun yang emailnya sama dengan `VITE_SUPER_ADMIN_EMAIL` di `.env.local`.

### 7.1 Daftar akun Super Admin

1. Buka aplikasi → klik **Daftar**
2. Isi email yang sama dengan `VITE_SUPER_ADMIN_EMAIL`
3. Isi informasi bisnis (akan diabaikan untuk super admin)
4. Verifikasi email
5. Login → akan otomatis redirect ke `/admin/`

### 7.2 Alternatif: Buat user langsung di Supabase

Pergi ke **Authentication → Users → Add user**:

| Field | Nilai |
|-------|-------|
| **Email** | `admin@tokiq.id` (sesuai `VITE_SUPER_ADMIN_EMAIL`) |
| **Password** | Password kuat |
| **Auto Confirm User** | ✅ Centang |

Setelah dibuat, login ke aplikasi dengan email tersebut — akan langsung masuk ke dashboard admin.

---

## 8. Verifikasi Setup

Jalankan query-query berikut di **SQL Editor** untuk memastikan semuanya benar.

### 8.1 Cek tabel sudah ada

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Hasil yang diharapkan — harus ada 21 tabel:
```
branches, cash_movements, categories, customers, discounts,
invoices, product_addons, product_prices, product_variants, products,
purchase_items, purchases, shifts, stock_movements, stocks,
subscription_plans, suppliers, tenant_users, tenants,
transaction_items, transactions
```

### 8.2 Cek RLS aktif di semua tabel

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Semua kolom `rowsecurity` harus `true`.

### 8.3 Cek subscription plans sudah ter-seed

```sql
SELECT id, name, price_monthly, trial_days, is_active
FROM subscription_plans;
```

Harus ada 2 row: Starter dan Pro.

### 8.4 Cek fungsi helper ada

```sql
SELECT proname, prosrc
FROM pg_proc
WHERE proname IN ('get_user_tenant_id', 'decrement_stock', 'upsert_stock')
ORDER BY proname;
```

Harus ada 3 fungsi.

### 8.5 Cek storage buckets

```sql
SELECT name, public
FROM storage.buckets;
```

Harus ada 3 bucket: `product-images`, `payment-proofs`, `tenant-logos`.

---

## 9. Setup untuk Development Lokal

Kalau mau pakai Supabase local (opsional, perlu Docker):

### 9.1 Install Supabase CLI

```bash
# Windows (via scoop)
scoop install supabase

# atau via npm
npm install -g supabase
```

### 9.2 Init dan start lokal

```bash
supabase init
supabase start
```

Output akan memberikan URL dan keys lokal. Update `.env.local` dengan keys tersebut.

### 9.3 Jalankan migrations lokal

```bash
supabase db reset
# Otomatis menjalankan semua file di supabase/migrations/
```

### 9.4 Buat file config Supabase

Buat file `supabase/config.toml` jika belum ada:

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323

[auth]
site_url = "http://localhost:5173"
additional_redirect_urls = [
  "http://localhost:5173/verify-email",
  "http://localhost:5173/onboarding",
  "http://localhost:5173/reset-password"
]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true
```

---

## 10. Checklist Sebelum Production

Centang semua ini sebelum launch:

### Database
- [ ] Semua 22 tabel ada dan terurut dengan benar
- [ ] RLS aktif di semua tabel (0 tabel tanpa RLS)
- [ ] Fungsi `decrement_stock`, `upsert_stock`, `get_user_tenant_id` ada
- [ ] Trigger `update_updated_at` aktif di `tenants` dan `products`
- [ ] Subscription plans ter-seed (Starter + Pro)
- [ ] Partial unique index untuk `stocks` tabel sudah dibuat

### Auth
- [ ] Email confirmation aktif
- [ ] Redirect URLs mencakup domain production
- [ ] Email templates sudah diupdate (bukan template default Supabase)
- [ ] SMTP custom dikonfigurasi (Supabase free tier punya limit 3 email/jam)

### Storage
- [ ] 3 bucket dibuat: `product-images`, `payment-proofs`, `tenant-logos`
- [ ] Storage policies sudah benar (public vs private)

### Aplikasi
- [ ] `.env.local` diisi dengan keys production
- [ ] `VITE_SUPER_ADMIN_EMAIL` diset ke email admin yang benar
- [ ] Akun super admin sudah dibuat dan bisa login ke `/admin/`
- [ ] Test registrasi tenant baru → verifikasi email → onboarding → dashboard
- [ ] Test transaksi POS end-to-end (shift → produk → bayar → struk)

### Security
- [ ] `SUPABASE_SERVICE_ROLE_KEY` tidak ada di variabel `VITE_*`
- [ ] `.env.local` ada di `.gitignore` (sudah dari awal)
- [ ] Supabase project di-set ke **Pause protection ON** (Settings → General)

---

## Setup SMTP Custom (Opsional tapi Disarankan)

Supabase Free tier punya limit 3 email/jam. Untuk production, pakai SMTP custom.

### Opsi 1: Resend (Recommended)

1. Daftar di [resend.com](https://resend.com)
2. Tambahkan dan verifikasi domain kamu
3. Buat API key
4. Di Supabase: **Project Settings → Authentication → SMTP Settings**

```
Host:       smtp.resend.com
Port:       465
Username:   resend
Password:   [API Key dari Resend]
Sender name: tokiq
Sender email: noreply@tokiq.id
```

### Opsi 2: Brevo / SendGrid

Sama seperti Resend, tinggal sesuaikan SMTP host dan credentials.

---

## Troubleshooting Umum

### Error: "Failed to fetch" saat login
→ Cek `VITE_SUPABASE_URL` di `.env.local`. Pastikan tidak ada trailing slash.

### Error: "new row violates row-level security policy"
→ RLS menolak insert. Biasanya karena `tenant_id` tidak diisi atau user belum punya record di `tenant_users`. Cek fungsi `get_user_tenant_id()` lewat SQL Editor:
```sql
SELECT get_user_tenant_id(); -- jalankan sebagai user yang login
```

### Error: "UNIQUE constraint violated" di stocks
→ Jalankan ulang migration 4.3 (partial unique index).

### Email verifikasi tidak masuk
→ Cek spam folder. Di development, Supabase mengirim ke **Inbucket** lokal di `http://localhost:54324`.

### Kasir tidak bisa buka shift — "Branch tidak ditemukan"
→ Pastikan saat onboarding, branch utama (`is_main = true`) berhasil dibuat. Cek:
```sql
SELECT * FROM branches WHERE tenant_id = '[tenant_id_kamu]';
```

---

*Setup selesai. Jalankan `npm run dev` dan mulai testing.*
