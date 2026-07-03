import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth.context'
import { registerSchema, type RegisterFormValues } from '@/lib/validations/auth.schema'
import { BUSINESS_TYPES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
      businessName: '',
      businessType: 'fnb',
      phone: '',
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    try {
      await signUp(values.email, values.password, {
        business_name: values.businessName,
        business_type: values.businessType,
        phone: values.phone,
      })
      toast.success('Akun berhasil dibuat! Cek email kamu untuk verifikasi.')
      navigate({ to: '/login' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mendaftar'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg tracking-tight">tokiq</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Buat akun gratis</CardTitle>
            <CardDescription>
              Trial 14 hari, tanpa kartu kredit.{' '}
              <Link to="/login" className="text-foreground underline underline-offset-4 hover:no-underline">
                Sudah punya akun?
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="businessName">Nama Toko / Bisnis</Label>
                <Input
                  id="businessName"
                  placeholder="Contoh: Warung Bu Sari"
                  {...form.register('businessName')}
                />
                {form.formState.errors.businessName && (
                  <p className="text-xs text-destructive">{form.formState.errors.businessName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessType">Jenis Bisnis</Label>
                <Select
                  defaultValue={form.getValues('businessType')}
                  onValueChange={(val) =>
                    form.setValue('businessType', val as RegisterFormValues['businessType'], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="businessType">
                    <SelectValue placeholder="Pilih jenis bisnis" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.businessType && (
                  <p className="text-xs text-destructive">{form.formState.errors.businessType.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="kamu@email.com"
                  autoComplete="email"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">No. HP (opsional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="08123456789"
                  {...form.register('phone')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="passwordConfirm">Konfirmasi Password</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                  {...form.register('passwordConfirm')}
                />
                {form.formState.errors.passwordConfirm && (
                  <p className="text-xs text-destructive">{form.formState.errors.passwordConfirm.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat akun...
                  </>
                ) : (
                  'Buat Akun Gratis'
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Dengan mendaftar, kamu menyetujui syarat & ketentuan layanan tokiq.
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            ← Kembali ke beranda
          </Link>
        </p>
      </div>
    </div>
  )
}
