# Design Document — tokiq SaaS Platform
**Version:** 1.0.0  
**Status:** Draft  
**Last Updated:** 2026-06-21

---

## 1. Tech Stack

### 1.1 Core Stack

| Layer | Teknologi | Alasan Pemilihan |
|-------|-----------|------------------|
| **Framework** | React 19 + Vite | SPA murni, lebih ringan dari Next.js untuk POS offline |
| **Language** | TypeScript 5 (strict) | Type safety end-to-end |
| **Styling** | Tailwind CSS v4 | Utility-first, performa terbaik |
| **UI Components** | shadcn/ui (latest) | Copy-paste, full kontrol, tanpa dependency lock-in |
| **Database + Auth** | Supabase (Postgres + Auth + Realtime) | Multi-tenant ready, RLS built-in, offline support |
| **State (Server)** | TanStack Query v5 | Caching, background sync, optimistic updates |
| **State (Client)** | Zustand v5 | Lightweight, zero boilerplate, persist middleware |
| **Router** | TanStack Router v2 | Type-safe routing, file-based, lebih baik dari React Router untuk TypeScript |
| **Forms** | React Hook Form + Zod | Performa terbaik, zero re-render, schema validation |
| **Email** | Resend + React Email | DX terbaik 2026, JSX-based email templates |
| **Charts** | Recharts | Composable, Tailwind-compatible |
| **Tables** | TanStack Table v8 | Headless, sorting/filter/pagination built-in |
| **Date** | date-fns | Tree-shakeable, immutable |
| **PDF Export** | @react-pdf/renderer | Generate PDF laporan di client |
| **Excel Export** | SheetJS (xlsx) | Export laporan ke .xlsx |
| **Barcode** | @zxing/browser | Scan barcode via kamera browser |
| **Drag & Drop** | dnd-kit | Untuk reorder produk/kategori |
| **Toasts** | sonner | Minimalist, shadcn-native |
| **Icons** | Lucide React | Konsisten dengan shadcn/ui |
| **HTTP Client** | Supabase JS SDK | Native, tidak perlu Axios |

### 1.2 Development Tools

| Tool | Fungsi |
|------|--------|
| ESLint + Prettier | Code quality & formatting |
| Husky + lint-staged | Pre-commit hooks |
| Vitest | Unit testing |
| Playwright | E2E testing |
| pnpm | Package manager (lebih cepat dari npm) |

### 1.3 Deployment

| Layer | Service |
|-------|---------|
| **Frontend** | Vercel (atau Netlify) |
| **Database** | Supabase Cloud |
| **Email** | Resend |
| **Storage** | Supabase Storage (foto produk, logo toko) |
| **CDN** | Vercel Edge Network |

---

## 2. Arsitektur Sistem

### 2.1 Gambaran Umum

```
┌─────────────────────────────────────────────┐
│              Browser (React SPA)             │
│  ┌────────────┐  ┌────────────────────────┐  │
│  │ Super Admin│  │   Tenant App (POS)     │  │
│  │ Dashboard  │  │ /dashboard /kasir ...  │  │
│  └─────┬──────┘  └──────────┬─────────────┘  │
└────────┼────────────────────┼────────────────┘
         │ Supabase JS SDK    │
         ▼                    ▼
┌─────────────────────────────────────────────┐
│              Supabase Platform               │
│  ┌──────────┐ ┌────────┐ ┌───────────────┐  │
│  │ Postgres │ │  Auth  │ │   Realtime    │  │
│  │ + RLS    │ │  JWT   │ │  (live sync)  │  │
│  └──────────┘ └────────┘ └───────────────┘  │
│  ┌──────────┐ ┌────────────────────────────┐ │
│  │ Storage  │ │    Edge Functions          │ │
│  │ (images) │ │ (webhooks, cron, billing)  │ │
│  └──────────┘ └────────────────────────────┘ │
└─────────────────────────────────────────────┘
         │
         ▼
┌────────────────┐
│     Resend     │
│  (Email notif) │
└────────────────┘
```

### 2.2 Multi-Tenancy Strategy

Semua tabel utama memiliki kolom `tenant_id` (UUID). Row Level Security (RLS) Supabase memastikan setiap query hanya mengembalikan data milik tenant yang sedang login.

```sql
-- Contoh RLS policy
CREATE POLICY "Tenant can only see own data"
ON products
FOR ALL
USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

Super Admin memiliki bypass RLS via service role key yang hanya digunakan di Edge Functions.

### 2.3 Offline Strategy

Mode offline menggunakan Zustand `persist` middleware + IndexedDB untuk menyimpan:
- Daftar produk (cache)
- Transaksi yang belum tersync

Saat online kembali, TanStack Query akan trigger sync otomatis via `onlineManager`.

---

## 3. Struktur Database

### 3.1 Schema Utama

```sql
-- ===========================
-- PLATFORM TABLES (Super Admin)
-- ===========================

-- Paket langganan
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,               -- "Starter", "Pro"
  price_monthly INTEGER NOT NULL,   -- dalam Rupiah
  price_yearly INTEGER,
  trial_days INTEGER DEFAULT 14,
  is_active BOOLEAN DEFAULT true,
  features JSONB,                   -- daftar fitur
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant (subscriber)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id),
  business_name TEXT NOT NULL,
  business_type TEXT,               -- "fnb", "retail", "service", dll
  email TEXT NOT NULL,
  phone TEXT,
  logo_url TEXT,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'trial',      -- "trial", "active", "suspended", "expired"
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice / billing
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  plan_id UUID REFERENCES subscription_plans(id),
  amount INTEGER NOT NULL,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',    -- "pending", "paid", "expired", "cancelled"
  payment_method TEXT,              -- "transfer_bank"
  payment_proof_url TEXT,           -- bukti transfer
  paid_at TIMESTAMPTZ,
  confirmed_by UUID,                -- super admin yang konfirmasi
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- TENANT TABLES (POS App)
-- ===========================

-- Cabang usaha
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff / user tenant
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  branch_id UUID REFERENCES branches(id),
  role TEXT NOT NULL,              -- "owner", "manager", "cashier", "warehouse"
  name TEXT NOT NULL,
  pin TEXT,                         -- PIN kasir (4-6 digit, hashed)
  is_active BOOLEAN DEFAULT true,
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kategori produk
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produk
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  description TEXT,
  image_url TEXT,
  sell_price INTEGER NOT NULL,
  cost_price INTEGER DEFAULT 0,
  has_variants BOOLEAN DEFAULT false,
  has_addons BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Harga per tipe pelanggan
CREATE TABLE product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  price_type TEXT NOT NULL,        -- "regular", "wholesale", "member"
  price INTEGER NOT NULL
);

-- Varian produk
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  variant_name TEXT NOT NULL,      -- "Ukuran: L"
  sku TEXT,
  barcode TEXT,
  additional_price INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Add-on / topping
CREATE TABLE product_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  price INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Stok
CREATE TABLE stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  variant_id UUID REFERENCES product_variants(id),
  branch_id UUID REFERENCES branches(id) NOT NULL,
  quantity INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,     -- threshold notifikasi
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, variant_id, branch_id)
);

-- Mutasi stok
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  variant_id UUID REFERENCES product_variants(id),
  branch_id UUID REFERENCES branches(id) NOT NULL,
  type TEXT NOT NULL,              -- "sale", "purchase", "adjustment", "transfer_in", "transfer_out", "return"
  quantity INTEGER NOT NULL,
  reference_id UUID,               -- transaction_id / purchase_id
  notes TEXT,
  created_by UUID REFERENCES tenant_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  branch_id UUID REFERENCES branches(id) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  invoice_number TEXT,
  status TEXT DEFAULT 'pending',   -- "pending", "received", "partial"
  total_amount INTEGER DEFAULT 0,
  notes TEXT,
  received_at TIMESTAMPTZ,
  created_by UUID REFERENCES tenant_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  cost_price INTEGER NOT NULL,
  subtotal INTEGER NOT NULL
);

-- Pelanggan
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  points INTEGER DEFAULT 0,
  customer_group TEXT DEFAULT 'regular', -- "regular", "member", "vip"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shift kasir
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  branch_id UUID REFERENCES branches(id) NOT NULL,
  cashier_id UUID REFERENCES tenant_users(id) NOT NULL,
  opening_cash INTEGER DEFAULT 0,
  closing_cash INTEGER,
  status TEXT DEFAULT 'open',      -- "open", "closed"
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  notes TEXT
);

-- Kas (pengeluaran / pemasukan non-transaksi)
CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  shift_id UUID REFERENCES shifts(id) NOT NULL,
  branch_id UUID REFERENCES branches(id) NOT NULL,
  type TEXT NOT NULL,              -- "in", "out"
  amount INTEGER NOT NULL,
  description TEXT,
  created_by UUID REFERENCES tenant_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaksi penjualan
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  branch_id UUID REFERENCES branches(id) NOT NULL,
  shift_id UUID REFERENCES shifts(id),
  cashier_id UUID REFERENCES tenant_users(id) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  receipt_number TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  discount_amount INTEGER DEFAULT 0,
  tax_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  payment_method TEXT NOT NULL,    -- "cash", "qris", "transfer"
  paid_amount INTEGER,
  change_amount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed', -- "completed", "voided", "pending"
  notes TEXT,
  is_synced BOOLEAN DEFAULT false, -- untuk offline tracking
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  variant_id UUID REFERENCES product_variants(id),
  product_name TEXT NOT NULL,      -- snapshot nama produk saat transaksi
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  discount_amount INTEGER DEFAULT 0,
  subtotal INTEGER NOT NULL,
  addons JSONB                     -- snapshot add-ons
);

-- Diskon
CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,              -- "percentage", "fixed"
  value INTEGER NOT NULL,
  min_purchase INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ
);
```

---

## 4. Desain Sistem (UI/UX)

### 4.1 Prinsip Desain
- **Minimalism anti-AI-slop:** Tidak ada gradien neon, card berlapis-lapis, atau animasi tidak perlu.
- **Data density:** POS butuh informasi padat — tabel, angka, status. Prioritaskan keterbacaan.
- **Speed first:** Setiap interaksi harus terasa instan. Optimistic updates di semua mutation.
- **Mobile-first kasir:** Layar transaksi dioptimasi untuk tablet/HP.
- **Konsistensi:** Satu komponen = satu tujuan. Tidak ada variasi yang tidak perlu.

### 4.2 Color System (Tailwind + shadcn)

```css
/* Palette utama — clean, neutral, professional */
--background: oklch(1 0 0);          /* white */
--foreground: oklch(0.145 0 0);      /* near-black */
--muted: oklch(0.97 0 0);            /* light gray */
--muted-foreground: oklch(0.556 0 0);
--border: oklch(0.922 0 0);
--primary: oklch(0.205 0 0);         /* dark, bukan biru cerah */
--primary-foreground: oklch(0.985 0 0);

/* Status colors */
--success: oklch(0.527 0.154 142);   /* hijau natural */
--warning: oklch(0.769 0.188 70);    /* amber */
--danger: oklch(0.577 0.245 27);     /* merah */
--info: oklch(0.546 0.141 243);      /* biru tenang */
```

### 4.3 Typography

```
Font: Geist (Vercel) atau Inter — system-first fallback
Heading: font-semibold, tidak pernah > 24px di dashboard
Body: 14px, line-height 1.6
Label: 12px, text-muted-foreground, uppercase tracking-wide
Mono (angka/kode): font-mono, tabular-nums
```

### 4.4 Component Conventions (shadcn/ui)

Gunakan komponen shadcn berikut secara konsisten:

| Use Case | Komponen |
|----------|----------|
| Layout halaman | `<SidebarProvider>`, `<AppSidebar>`, `<SidebarInset>` |
| Data table | `<DataTable>` (shadcn + TanStack Table) |
| Form | `<Form>`, `<FormField>`, `<FormItem>`, `<FormMessage>` |
| Modal | `<Dialog>`, `<DialogContent>` |
| Konfirmasi hapus | `<AlertDialog>` |
| Input | `<Input>`, `<Select>`, `<Checkbox>`, `<Switch>` |
| Status | `<Badge>` dengan variant |
| Loading | `<Skeleton>` (bukan spinner global) |
| Notifikasi | `sonner` toast |
| Stat card | Custom `<MetricCard>` di atas shadcn `<Card>` |
| Tanggal | `<DateRangePicker>` (shadcn calendar) |

### 4.5 Aturan Desain yang Wajib Dipatuhi

```
✅ DO:
- Gunakan space-y-4 / space-y-6 untuk jarak konsisten
- Gunakan text-muted-foreground untuk label sekunder
- Gunakan border-border untuk semua border
- Tabel dengan sticky header di viewport panjang
- Empty state yang informatif (bukan halaman kosong)
- Error message di bawah field form (bukan alert popup)

❌ DON'T:
- Jangan gradient di komponen utama
- Jangan shadow tebal (max shadow-sm)
- Jangan animasi page transition yang lambat
- Jangan warna background yang mencolok di sidebar
- Jangan font-size > 16px untuk konten body
- Jangan card dalam card dalam card (max 1 level nesting)
```

---

## 5. Struktur Folder Project

```
tokiq/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                    # entry point
│   ├── app.tsx                     # root + providers
│   │
│   ├── routes/                     # TanStack Router file-based routing
│   │   ├── __root.tsx              # root layout
│   │   ├── index.tsx               # landing page
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   │
│   │   ├── (super-admin)/          # layout group
│   │   │   ├── _layout.tsx         # admin sidebar layout
│   │   │   ├── dashboard.tsx
│   │   │   ├── tenants/
│   │   │   │   ├── index.tsx       # list semua tenant
│   │   │   │   └── $tenantId.tsx   # detail tenant
│   │   │   ├── plans.tsx           # manajemen paket
│   │   │   ├── invoices.tsx        # konfirmasi pembayaran
│   │   │   └── reports.tsx         # MRR, churn, dll
│   │   │
│   │   └── (tenant)/               # layout group
│   │       ├── _layout.tsx         # tenant sidebar layout
│   │       ├── dashboard.tsx
│   │       ├── kasir.tsx           # POS interface
│   │       ├── products/
│   │       │   ├── index.tsx       # list produk
│   │       │   └── new.tsx         # tambah produk
│   │       ├── categories.tsx
│   │       ├── inventory/
│   │       │   ├── index.tsx       # stok overview
│   │       │   ├── opname.tsx      # stok opname
│   │       │   └── purchase/       # pembelian supplier
│   │       ├── customers.tsx
│   │       ├── suppliers.tsx
│   │       ├── transactions.tsx    # riwayat transaksi
│   │       ├── reports/
│   │       │   ├── sales.tsx
│   │       │   ├── finance.tsx
│   │       │   ├── stock.tsx
│   │       │   └── staff.tsx
│   │       ├── shifts.tsx
│   │       ├── staff.tsx
│   │       ├── branches.tsx
│   │       └── settings/
│   │           ├── store.tsx
│   │           ├── billing.tsx
│   │           └── printer.tsx
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components (auto-generated)
│   │   ├── layout/
│   │   │   ├── super-admin-sidebar.tsx
│   │   │   ├── tenant-sidebar.tsx
│   │   │   └── app-header.tsx
│   │   ├── shared/
│   │   │   ├── data-table.tsx      # TanStack Table wrapper
│   │   │   ├── metric-card.tsx
│   │   │   ├── date-range-picker.tsx
│   │   │   ├── confirm-dialog.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── page-header.tsx
│   │   │   └── export-button.tsx
│   │   └── features/
│   │       ├── kasir/
│   │       │   ├── product-grid.tsx
│   │       │   ├── cart.tsx
│   │       │   ├── payment-modal.tsx
│   │       │   ├── receipt-modal.tsx
│   │       │   └── barcode-scanner.tsx
│   │       ├── products/
│   │       │   ├── product-form.tsx
│   │       │   └── import-excel-modal.tsx
│   │       ├── reports/
│   │       │   ├── sales-chart.tsx
│   │       │   └── export-report.tsx
│   │       └── billing/
│   │           ├── subscription-card.tsx
│   │           └── payment-upload.tsx
│   │
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client singleton
│   │   ├── supabase-server.ts      # Admin client (service role)
│   │   ├── utils.ts                # cn(), formatRupiah(), dll
│   │   ├── validations/            # Zod schemas
│   │   │   ├── product.schema.ts
│   │   │   ├── transaction.schema.ts
│   │   │   ├── auth.schema.ts
│   │   │   └── tenant.schema.ts
│   │   └── constants.ts
│   │
│   ├── hooks/
│   │   ├── use-auth.ts             # current user + tenant info
│   │   ├── use-tenant.ts           # tenant context
│   │   ├── use-branch.ts           # active branch
│   │   └── use-permissions.ts      # role-based access
│   │
│   ├── stores/                     # Zustand stores
│   │   ├── cart.store.ts           # keranjang kasir
│   │   ├── shift.store.ts          # shift aktif
│   │   ├── offline.store.ts        # transaksi offline pending
│   │   └── settings.store.ts       # app settings (printer, dll)
│   │
│   ├── services/                   # API / Supabase queries
│   │   ├── products.service.ts
│   │   ├── transactions.service.ts
│   │   ├── stock.service.ts
│   │   ├── reports.service.ts
│   │   ├── tenants.service.ts      # super admin only
│   │   └── billing.service.ts
│   │
│   └── types/
│       ├── database.types.ts       # auto-generated dari Supabase CLI
│       ├── app.types.ts            # custom app types
│       └── api.types.ts
│
├── supabase/
│   ├── migrations/                 # SQL migrations
│   │   ├── 001_init_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_seed_plans.sql
│   ├── functions/                  # Supabase Edge Functions
│   │   ├── send-notification/      # email notif via Resend
│   │   ├── confirm-payment/        # aktivasi tenant setelah bayar
│   │   └── check-expired/          # cron: cek expired subscription
│   └── config.toml
│
├── .env.local                      # environment variables (tidak di-commit)
├── .env.example
├── components.json                 # shadcn/ui config
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 6. Konvensi Kode

### 6.1 Naming Convention

```typescript
// Komponen: PascalCase
export function ProductForm() {}
export function DataTable<T>() {}

// Hooks: camelCase dengan prefix 'use'
export function useProducts() {}
export function useCartStore() {}

// Services: camelCase dengan suffix 'Service'
export const productsService = {}

// Types: PascalCase
type Product = {}
type TransactionItem = {}
interface CreateProductDto = {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_CART_ITEMS = 100
const DEFAULT_TAX_RATE = 0.11

// File names: kebab-case
// product-form.tsx, use-products.ts, products.service.ts
```

### 6.2 Struktur Komponen

```typescript
// Template komponen feature
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// 1. Types / Schema di atas
const formSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  price: z.number().min(0),
})

type FormValues = z.infer<typeof formSchema>

// 2. Komponen
export function ProductForm({ productId }: { productId?: string }) {
  // 3. Hooks
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema) })
  
  // 4. Queries / Mutations
  const { data } = useQuery({ queryKey: ['product', productId], ... })
  
  // 5. Handlers
  function onSubmit(values: FormValues) {}
  
  // 6. Render
  return (...)
}
```

### 6.3 TanStack Query Convention

```typescript
// Query Keys — gunakan factory pattern
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
}

// Contoh penggunaan
const { data } = useQuery({
  queryKey: productKeys.list({ category: 'makanan' }),
  queryFn: () => productsService.getAll({ category: 'makanan' }),
  staleTime: 5 * 60 * 1000, // 5 menit
})
```

### 6.4 Supabase RLS — Wajib di Setiap Tabel

Setiap tabel wajib memiliki RLS policy. Tidak boleh ada tabel tanpa RLS.

```sql
-- Pattern standar
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON table_name
  FOR ALL
  TO authenticated
  USING (tenant_id = (
    SELECT tenant_id FROM tenant_users 
    WHERE user_id = auth.uid() 
    LIMIT 1
  ));
```

---

## 7. Environment Variables

```bash
# .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx

# Hanya untuk Edge Functions (server-side, tidak expose ke client)
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
RESEND_API_KEY=re_xxx
APP_URL=https://tokiq.id
```

---

## 8. Email Templates (Resend + React Email)

Template email yang dibutuhkan:
1. `welcome.tsx` — selamat datang + info trial
2. `trial-expiring.tsx` — H-7, H-3, H-1 sebelum trial habis
3. `subscription-expiring.tsx` — H-7, H-3, H-1 sebelum langganan habis
4. `payment-confirmed.tsx` — konfirmasi pembayaran berhasil
5. `invoice.tsx` — invoice PDF attachment
6. `password-reset.tsx` — reset password

---

## 9. Performance Guidelines

- **Lazy loading:** Semua route-level component menggunakan `React.lazy()`
- **Pagination:** Semua list data menggunakan cursor-based pagination (Supabase `.range()`)
- **Virtualization:** List produk > 100 item menggunakan `@tanstack/virtual`
- **Image optimization:** Foto produk di-resize ke maks 800x800 sebelum upload ke Supabase Storage
- **Memoization:** Gunakan `useMemo` / `useCallback` hanya jika ada bottleneck terukur
- **Bundle splitting:** Recharts, @react-pdf/renderer, SheetJS di-lazy load saat dibutuhkan
