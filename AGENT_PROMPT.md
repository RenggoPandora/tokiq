# AGENT PROMPT — tokiq SaaS Platform

> **Instruksi ini wajib dibaca penuh sebelum menulis satu baris kode pun.**

---

## IDENTITAS PROYEK

Kamu adalah AI coding agent yang ditugaskan membangun **tokiq**, sebuah platform POS (Point of Sale) berbasis SaaS. Proyek ini menggunakan:

- **React 19 + Vite + TypeScript 5 (strict)**
- **Supabase** (Postgres + Auth + Realtime + Storage)
- **TanStack Router v2** (file-based routing)
- **TanStack Query v5** (server state)
- **Zustand v5** (client state)
- **shadcn/ui + Tailwind CSS v4** (UI)
- **React Hook Form + Zod** (forms)
- **Resend + React Email** (email)
- **Recharts** (grafik)
- **TanStack Table v8** (tabel data)
- **Sonner** (toast)
- **Lucide React** (ikon)

Dokumentasi lengkap ada di:
- `PRD.md` — product requirements
- `DESIGN.md` — tech stack, arsitektur, struktur folder, konvensi kode
- `AGENT_PROMPT.md` — file ini

---

## ⚠️ ATURAN WAJIB — ANTI-HALUSINASI

### RULE 1: SELALU CEK PROGRESS SEBELUM LANJUT

**Sebelum mengerjakan task apapun**, kamu WAJIB:

1. Baca file `PROGRESS.md` jika sudah ada
2. Baca file terkait yang sudah dibuat sebelumnya
3. Nyatakan dengan eksplisit apa yang sudah ada dan apa yang akan dikerjakan

Format wajib sebelum mulai coding:

```
📋 PROGRESS CHECK
==================
Sudah ada:
- [list file/fitur yang sudah dibuat]

Belum ada:
- [list yang belum]

Yang akan dikerjakan sekarang:
- [task spesifik]

Asumsi yang dibuat:
- [list asumsi, jika ada]
==================
```

---

### RULE 2: UPDATE PROGRESS.MD SETIAP SELESAI TASK

Setiap kali menyelesaikan sebuah task atau file, **selalu update `PROGRESS.md`** dengan format:

```markdown
# PROGRESS — tokiq

## Status: [PHASE/STEP]
Last Updated: [tanggal]

## Selesai ✅
- [ fitur/file ] — [deskripsi singkat]

## Sedang Dikerjakan 🔄
- [ task ] — [status detail]

## Belum Dimulai ⏳
- [ task ]

## Catatan Penting
- [masalah yang ditemukan]
- [keputusan arsitektur yang diambil]
- [hal yang perlu ditinjau]
```

---

### RULE 3: JANGAN BERASUMSI TENTANG FILE YANG BELUM DIBACA

- Jika tidak yakin isi sebuah file, **baca dulu** sebelum memodifikasinya
- Jika tidak yakin apakah sebuah komponen sudah ada, **cek direktori** dulu
- Jika tidak yakin apakah migrasi database sudah dijalankan, **cek folder `/supabase/migrations/`**

---

### RULE 4: SATU TASK = SATU SCOPE

Kerjakan **satu task spesifik** per sesi. Jangan mencoba mengerjakan 5 hal sekaligus. Contoh task yang benar:
- ✅ "Buat komponen `ProductForm` dengan validasi Zod"
- ✅ "Buat migration SQL untuk tabel `products` dan `categories`"
- ✅ "Implementasi TanStack Query hook untuk `useProducts`"
- ❌ "Buat semua fitur produk" (terlalu luas)

---

### RULE 5: VALIDASI OUTPUT SEBELUM SELESAI

Sebelum menyatakan task selesai, verifikasi:

```
✅ TypeScript: tidak ada `any` yang tidak disengaja
✅ Imports: semua import valid dan file tujuan ada
✅ Zod schema: konsisten dengan database types
✅ RLS: setiap query ke Supabase mempertimbangkan tenant_id
✅ Error handling: semua async function punya try-catch atau error boundary
✅ Komponen: tidak ada hardcoded string (gunakan konstanta atau i18n)
```

---

## KONTEKS BISNIS

### Dua Jenis Pengguna Utama

**1. Super Admin (Platform Owner)**
- URL: `/admin/*`
- Akses: semua data semua tenant
- Dashboard: MRR, subscriber, billing, konfirmasi pembayaran manual

**2. Tenant (Owner Bisnis / Subscriber)**
- URL: `/app/*` atau `/:tenantSlug/*`
- Akses: data bisnis mereka sendiri saja (RLS enforced)
- Fitur: POS kasir, stok, laporan, staff, dll

---

## POLA KODE YANG HARUS DIIKUTI

### Supabase Client

```typescript
// src/lib/supabase.ts — SELALU gunakan singleton ini
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### Service Layer Pattern

```typescript
// src/services/products.service.ts
import { supabase } from '@/lib/supabase'
import type { Product, CreateProductDto } from '@/types/app.types'

export const productsService = {
  async getAll(tenantId: string, filters?: ProductFilters) {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('tenant_id', tenantId)   // SELALU filter tenant_id
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    return data
  },
  
  async create(dto: CreateProductDto) {
    const { data, error } = await supabase
      .from('products')
      .insert(dto)
      .select()
      .single()
    
    if (error) throw error
    return data
  },
}
```

### TanStack Query Hook Pattern

```typescript
// src/hooks/use-products.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService } from '@/services/products.service'
import { useTenant } from '@/hooks/use-tenant'
import { toast } from 'sonner'

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: ProductFilters) => [...productKeys.lists(), filters] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
}

export function useProducts(filters?: ProductFilters) {
  const { tenantId } = useTenant()
  
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productsService.getAll(tenantId, filters),
    staleTime: 5 * 60 * 1000,
    enabled: !!tenantId,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: productsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Produk berhasil ditambahkan')
    },
    onError: (error) => {
      toast.error(`Gagal menambahkan produk: ${error.message}`)
    },
  })
}
```

### Form Pattern (React Hook Form + Zod + shadcn)

```typescript
// Selalu gunakan pola ini untuk form
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const productSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi').max(100),
  sell_price: z.number({ invalid_type_error: 'Harga harus berupa angka' }).min(0),
  category_id: z.string().uuid().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

export function ProductForm() {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', sell_price: 0 },
  })

  function onSubmit(values: ProductFormValues) {
    // handle submit
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Produk</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Nasi Goreng" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
        </Button>
      </form>
    </Form>
  )
}
```

### Zustand Store Pattern

```typescript
// src/stores/cart.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  variants?: { name: string; price: number }[]
  addons?: { name: string; price: number }[]
}

interface CartStore {
  items: CartItem[]
  discount: number
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  setDiscount: (amount: number) => void
  clearCart: () => void
  get total(): number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,
      
      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.productId === item.productId)
        if (existing) {
          return {
            items: state.items.map(i =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          }
        }
        return { items: [...state.items, { ...item, quantity: 1 }] }
      }),
      
      removeItem: (productId) => set((state) => ({
        items: state.items.filter(i => i.productId !== productId)
      })),
      
      updateQty: (productId, qty) => set((state) => ({
        items: qty === 0
          ? state.items.filter(i => i.productId !== productId)
          : state.items.map(i => i.productId === productId ? { ...i, quantity: qty } : i)
      })),
      
      setDiscount: (amount) => set({ discount: amount }),
      clearCart: () => set({ items: [], discount: 0 }),
      
      get total() {
        const subtotal = get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        return subtotal - get().discount
      },
    }),
    { name: 'tokiq-cart' }
  )
)
```

### DataTable Pattern (TanStack Table + shadcn)

```typescript
// Gunakan komponen DataTable yang sudah ada di src/components/shared/data-table.tsx
// Jangan buat implementasi tabel dari awal

import { DataTable } from '@/components/shared/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { formatRupiah } from '@/lib/utils'

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'name',
    header: 'Nama Produk',
  },
  {
    accessorKey: 'sell_price',
    header: 'Harga Jual',
    cell: ({ row }) => formatRupiah(row.getValue('sell_price')),
  },
  {
    id: 'actions',
    cell: ({ row }) => <ProductActions product={row.original} />,
  },
]

// Gunakan di halaman
<DataTable columns={columns} data={products} searchKey="name" />
```

---

## STRUKTUR HALAMAN STANDAR

Setiap halaman utama WAJIB mengikuti layout ini:

```tsx
export function ProductsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <PageHeader
        title="Produk"
        description="Kelola produk dan harga toko kamu"
        action={
          <Button onClick={() => setOpenForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk
          </Button>
        }
      />
      
      {/* Content */}
      <DataTable columns={columns} data={products ?? []} />
      
      {/* Modals */}
      <ProductForm open={openForm} onOpenChange={setOpenForm} />
    </div>
  )
}
```

---

## URUTAN PENGERJAAN YANG DISARANKAN

Ikuti urutan ini untuk menghindari dependency error:

### Phase 1 — Setup & Foundation
```
[ ] 1.1 Init project (Vite + React + TypeScript)
[ ] 1.2 Install & konfigurasi: Tailwind v4, shadcn/ui
[ ] 1.3 Install semua library (TanStack, Zustand, Zod, dll)
[ ] 1.4 Setup Supabase client + types
[ ] 1.5 Buat struktur folder sesuai DESIGN.md
[ ] 1.6 Buat file utils.ts (formatRupiah, cn, dll)
[ ] 1.7 Buat PROGRESS.md
```

### Phase 2 — Database
```
[ ] 2.1 Migration: platform tables (subscription_plans, tenants, invoices)
[ ] 2.2 Migration: tenant tables (products, categories, stocks, dll)
[ ] 2.3 Migration: transaction tables
[ ] 2.4 RLS policies untuk semua tabel
[ ] 2.5 Seed data: subscription plans
[ ] 2.6 Generate database types (supabase gen types)
```

### Phase 3 — Auth & Layout
```
[ ] 3.1 Halaman login
[ ] 3.2 Halaman register
[ ] 3.3 Auth context (useAuth hook)
[ ] 3.4 Route protection (authenticated routes)
[ ] 3.5 Super Admin layout + sidebar
[ ] 3.6 Tenant layout + sidebar
[ ] 3.7 useAuth, useTenant, usePermissions hooks
```

### Phase 4 — Super Admin Dashboard
```
[ ] 4.1 Dashboard: MetricCard (MRR, subscribers, churn)
[ ] 4.2 Halaman Tenant: list + search + filter
[ ] 4.3 Halaman Tenant Detail
[ ] 4.4 Halaman Plans: CRUD paket
[ ] 4.5 Halaman Invoices: konfirmasi pembayaran
[ ] 4.6 Halaman Reports: grafik MRR
```

### Phase 5 — Tenant Onboarding
```
[ ] 5.1 Landing page + pricing
[ ] 5.2 Register flow
[ ] 5.3 Email verifikasi
[ ] 5.4 Onboarding wizard (4 steps)
[ ] 5.5 Tenant dashboard (ringkasan hari ini)
```

### Phase 6 — Manajemen Produk
```
[ ] 6.1 Service: productsService
[ ] 6.2 Hook: useProducts, useCreateProduct, dll
[ ] 6.3 Halaman Kategori: CRUD
[ ] 6.4 Halaman Produk: list + DataTable
[ ] 6.5 ProductForm: create + edit + varian
[ ] 6.6 Import Excel produk
```

### Phase 7 — Modul Kasir (POS)
```
[ ] 7.1 Zustand: cartStore, shiftStore
[ ] 7.2 Halaman Kasir: layout split (produk | keranjang)
[ ] 7.3 ProductGrid: search, kategori, tap produk
[ ] 7.4 Cart: add/remove/qty, diskon, pajak
[ ] 7.5 PaymentModal: tunai/QRIS/transfer
[ ] 7.6 ReceiptModal: preview + print + WA
[ ] 7.7 BarcodeScanner: @zxing/browser
[ ] 7.8 Offline mode: Zustand persist + sync
[ ] 7.9 Shift: buka/tutup shift, rekap kas
```

### Phase 8 — Stok & Supplier
```
[ ] 8.1 Service: stockService, supplierService
[ ] 8.2 Halaman Stok: overview per produk
[ ] 8.3 Stok Opname
[ ] 8.4 Pembelian Supplier (Purchase Order)
[ ] 8.5 Supplier CRUD
```

### Phase 9 — Pelanggan & Laporan
```
[ ] 9.1 Halaman Pelanggan: CRUD + riwayat
[ ] 9.2 Program Poin
[ ] 9.3 Laporan Penjualan + grafik
[ ] 9.4 Laporan Keuangan
[ ] 9.5 Laporan Stok
[ ] 9.6 Export Excel (SheetJS)
[ ] 9.7 Export PDF (react-pdf)
```

### Phase 10 — Staff, Cabang, Billing
```
[ ] 10.1 Manajemen Staff & hak akses
[ ] 10.2 Manajemen Cabang
[ ] 10.3 Billing tenant: status + upload bukti
[ ] 10.4 Email notifications (Resend)
[ ] 10.5 Edge Functions: confirm-payment, check-expired
```

### Phase 11 — Polish & Testing
```
[ ] 11.1 Empty states semua halaman
[ ] 11.2 Loading skeletons
[ ] 11.3 Error boundaries
[ ] 11.4 PWA setup (offline manifest)
[ ] 11.5 Unit tests (Vitest)
[ ] 11.6 E2E tests kritis (Playwright)
[ ] 11.7 Performance audit
```

---

## FORMAT KOMUNIKASI AGENT

Gunakan format ini setiap merespons task:

```
## 📋 Progress Check
[baca PROGRESS.md, nyatakan kondisi saat ini]

## 🎯 Task yang Dikerjakan
[nama task spesifik]

## 💻 Implementasi
[kode]

## ✅ Update PROGRESS.md
[perubahan pada PROGRESS.md]

## ⚠️ Catatan / Hal yang Perlu Diperhatikan
[jika ada dependency, asumsi, atau hal kritis]
```

---

## CHECKLIST ANTI-HALUSINASI

Tempel checklist ini di awal setiap sesi coding:

```
SEBELUM MULAI:
□ Sudah baca PROGRESS.md
□ Sudah cek file yang akan dimodifikasi
□ Sudah tau apa saja yang sudah ada dan belum ada

SAAT CODING:
□ Tidak menggunakan library yang tidak ada di package.json
□ Tidak mengimpor dari file yang belum dibuat
□ Tidak berasumsi tentang struktur komponen tanpa melihatnya
□ RLS selalu dipertimbangkan untuk setiap query Supabase

SETELAH SELESAI:
□ Update PROGRESS.md
□ Tidak ada TypeScript error (bukan 'as any' workaround)
□ Form validation menggunakan Zod schema
□ Error state ditangani dengan benar
□ Loading state ada di setiap async operation
```

---

## KONSTANTA PENTING

```typescript
// Jenis bisnis (untuk onboarding)
export const BUSINESS_TYPES = [
  { value: 'fnb', label: 'Kuliner / FnB' },
  { value: 'retail', label: 'Retail / Minimarket' },
  { value: 'fashion', label: 'Fashion / Butik' },
  { value: 'service', label: 'Jasa (Salon, Laundry, Bengkel)' },
  { value: 'electronics', label: 'Elektronik / Counter HP' },
  { value: 'other', label: 'Lainnya' },
] as const

// Metode pembayaran
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tunai' },
  { value: 'qris', label: 'QRIS' },
  { value: 'transfer', label: 'Transfer Bank' },
] as const

// Role tenant user
export const TENANT_ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  WAREHOUSE: 'warehouse',
} as const

// Status tenant
export const TENANT_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired',
} as const

// Stock movement types
export const STOCK_MOVEMENT_TYPES = {
  SALE: 'sale',
  PURCHASE: 'purchase',
  ADJUSTMENT: 'adjustment',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
  RETURN: 'return',
} as const
```

---

## UTILITIES WAJIB

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Wajib ada — digunakan shadcn/ui
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format angka ke Rupiah
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format tanggal ke Indonesia
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(new Date(date))
}

// Generate nomor struk
export function generateReceiptNumber(prefix = 'TRX'): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `${prefix}-${dateStr}-${random}`
}

// Hitung persentase
export function calcPercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}
```

---

## PESAN PENTING UNTUK AGENT

1. **Selalu baca PROGRESS.md dulu.** Ini satu-satunya cara untuk tahu di mana posisi proyek sekarang.

2. **Jangan skip langkah migrasi database.** Kode tidak akan jalan jika tabel belum ada.

3. **RLS bukan opsional.** Setiap tabel WAJIB punya RLS policy. Ini keamanan fundamental multi-tenant.

4. **TypeScript strict.** Jangan kompromi dengan `any`. Jika tipe tidak diketahui, gunakan `unknown` dan narrow dengan type guard.

5. **Komponen shadcn sudah ada setelah diinstall.** Jangan buat implementasi custom untuk komponen yang sudah ada di shadcn (Dialog, Form, Table, dll).

6. **Satu sumber kebenaran.** Database types di-generate dari Supabase CLI dan diimport dari `@/types/database.types`. Jangan duplikasi tipe.

7. **Format Rupiah konsisten.** Semua angka uang menggunakan `formatRupiah()` dari utils. Tidak ada hardcoded format lain.

8. **Offline-first untuk kasir.** Modul kasir harus bisa beroperasi tanpa internet. Desain dengan asumsi koneksi bisa putus kapan saja.
