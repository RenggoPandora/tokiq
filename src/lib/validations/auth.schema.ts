import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

export const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  passwordConfirm: z.string(),
  businessName: z.string().min(2, 'Nama toko minimal 2 karakter').max(100),
  businessType: z.enum(['fnb', 'retail', 'fashion', 'service', 'electronics', 'other'], {
    message: 'Pilih jenis bisnis',
  }),
  phone: z.string().optional(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Password tidak cocok',
  path: ['passwordConfirm'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password minimal 8 karakter'),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Password tidak cocok',
  path: ['passwordConfirm'],
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
