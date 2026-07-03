import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi').max(100, 'Nama terlalu panjang'),
  category_id: z.string().uuid().optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  barcode: z.string().max(50).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  sell_price: z.coerce
    .number({ error: 'Harga harus berupa angka' })
    .min(0, 'Harga tidak boleh negatif'),
  cost_price: z.coerce
    .number({ error: 'Harga modal harus berupa angka' })
    .min(0, 'Harga modal tidak boleh negatif')
    .optional()
    .default(0),
  has_variants: z.boolean().default(false),
  has_addons: z.boolean().default(false),
  is_active: z.boolean().default(true),
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(50),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  sort_order: z.coerce.number().int().min(0).default(0),
})

export const productVariantSchema = z.object({
  variant_name: z.string().min(1, 'Nama varian wajib diisi').max(100),
  sku: z.string().max(50).optional().nullable(),
  barcode: z.string().max(50).optional().nullable(),
  additional_price: z.coerce.number().min(0).default(0),
  is_active: z.boolean().default(true),
})

export const productAddonSchema = z.object({
  name: z.string().min(1, 'Nama add-on wajib diisi').max(100),
  price: z.coerce.number().min(0).default(0),
  is_active: z.boolean().default(true),
})

export type ProductFormValues = z.infer<typeof productSchema>
export type CategoryFormValues = z.infer<typeof categorySchema>
export type ProductVariantFormValues = z.infer<typeof productVariantSchema>
export type ProductAddonFormValues = z.infer<typeof productAddonSchema>
