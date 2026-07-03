import { z } from 'zod'

export const planSchema = z.object({
  name: z.string().min(1, 'Nama paket wajib diisi').max(50),
  price_monthly: z.coerce
    .number({ error: 'Harga harus angka' })
    .min(0, 'Harga tidak boleh negatif'),
  price_yearly: z.coerce.number().min(0).nullable().optional(),
  trial_days: z.coerce
    .number({ error: 'Trial days harus angka' })
    .int()
    .min(0)
    .max(365),
  is_active: z.boolean(),
  features: z.string().optional(),
})

export type PlanFormValues = z.infer<typeof planSchema>
