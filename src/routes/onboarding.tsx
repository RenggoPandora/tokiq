import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ShoppingCart, Building2, Package, Users, CheckCircle, Loader2, ArrowRight, ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth.context'
import { tenantOnboardingService } from '@/services/tenant.service'
import { BUSINESS_TYPES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
})

// ===========================
// Schemas per step
// ===========================

const step1Schema = z.object({
  businessName: z.string().min(2, 'Nama toko minimal 2 karakter').max(100),
  businessType: z.enum(['fnb', 'retail', 'fashion', 'service', 'electronics', 'other']),
  phone: z.string().optional(),
})
type Step1Values = z.infer<typeof step1Schema>

const STEPS = [
  { id: 1, label: 'Info Toko', icon: Building2 },
  { id: 2, label: 'Produk', icon: Package },
  { id: 3, label: 'Staff', icon: Users },
  { id: 4, label: 'Selesai', icon: CheckCircle },
]

function OnboardingPage() {
  const { user, authUser } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [, setTenantId] = useState<string | null>(authUser?.tenantId ?? null)

  const step1Form = useForm<Step1Values>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(step1Schema) as any,
    defaultValues: {
      businessName: authUser?.tenant?.business_name ?? '',
      businessType: (authUser?.tenant?.business_type as Step1Values['businessType']) ?? 'fnb',
      phone: authUser?.tenant?.phone ?? '',
    },
  })

  // ===========================
  // Step 1: Buat/update tenant
  // ===========================
  async function handleStep1(values: Step1Values) {
    if (!user) return
    setIsSubmitting(true)
    try {
      const tenant = await tenantOnboardingService.setupTenant(user.id, {
        businessName: values.businessName,
        businessType: values.businessType,
        phone: values.phone,
      })
      setTenantId(tenant.id)
      setCurrentStep(2)
    } catch (err) {
      toast.error(`Gagal menyimpan: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSkipToApp() {
    navigate({ to: '/app/dashboard' })
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <ShoppingCart className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-lg tracking-tight">tokiq</span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((step, i) => {
          const done = currentStep > step.id
          const active = currentStep === step.id
          return (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                  done && 'bg-primary text-primary-foreground',
                  active && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2',
                  !done && !active && 'bg-muted text-muted-foreground'
                )}
              >
                {done ? <CheckCircle className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:block',
                  active ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn('w-8 h-px mx-1', done ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-sm">
        {/* STEP 1 — Info Toko */}
        {currentStep === 1 && (
          <div>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-foreground">Setup Toko Kamu</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Masukkan informasi dasar bisnis kamu. Bisa diubah nanti di Pengaturan.
              </p>
            </div>
            <form
              onSubmit={step1Form.handleSubmit(handleStep1 as Parameters<typeof step1Form.handleSubmit>[0])}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="businessName">Nama Toko / Bisnis</Label>
                <Input
                  id="businessName"
                  placeholder="contoh: Warung Bu Sari"
                  {...step1Form.register('businessName')}
                />
                {step1Form.formState.errors.businessName && (
                  <p className="text-xs text-destructive">
                    {step1Form.formState.errors.businessName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessType">Jenis Bisnis</Label>
                <Select
                  defaultValue={step1Form.getValues('businessType')}
                  onValueChange={(v) =>
                    step1Form.setValue('businessType', v as Step1Values['businessType'], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="businessType">
                    <SelectValue placeholder="Pilih jenis bisnis" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">No. HP (opsional)</Label>
                <Input id="phone" type="tel" placeholder="08123456789" {...step1Form.register('phone')} />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                ) : (
                  <><ArrowRight className="mr-2 h-4 w-4" />Lanjut</>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* STEP 2 — Produk pertama */}
        {currentStep === 2 && (
          <div>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-foreground">Tambah Produk Pertama</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Kamu bisa tambah produk sekarang atau skip dan lakukan nanti.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-center mb-6">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Manajemen produk lengkap tersedia di menu <strong>Produk</strong> setelah onboarding.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
              <Button className="flex-1" onClick={() => setCurrentStep(3)}>
                Lewati
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Staff pertama */}
        {currentStep === 3 && (
          <div>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-foreground">Undang Staff</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tambahkan kasir atau manajer. Langkah ini bisa dilakukan nanti.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-center mb-6">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Manajemen staff tersedia di menu <strong>Staff</strong> setelah onboarding.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
              <Button className="flex-1" onClick={() => setCurrentStep(4)}>
                Lewati
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4 — Selesai */}
        {currentStep === 4 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Toko Siap! 🎉</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Selamat datang di tokiq! Trial gratis 14 hari kamu sudah aktif.
              Mulai tambah produk dan buka kasir pertamamu.
            </p>
            <div className="space-y-2">
              <Button className="w-full" onClick={handleSkipToApp}>
                Buka Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate({ to: '/app/products' })}
              >
                Tambah Produk Sekarang
              </Button>
            </div>
          </div>
        )}
      </div>

      {currentStep < 4 && (
        <button
          onClick={handleSkipToApp}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Lewati semua, langsung ke dashboard →
        </button>
      )}
    </div>
  )
}
