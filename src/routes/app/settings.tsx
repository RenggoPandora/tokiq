import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Store, Receipt, Shield } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/auth.context'
import { tenantOnboardingService } from '@/services/tenant.service'
import { BUSINESS_TYPES } from '@/lib/constants'

export const Route = createFileRoute('/app/settings')({
  component: SettingsPage,
})

const settingsSchema = z.object({
  business_name: z.string().min(2, 'Nama toko minimal 2 karakter').max(100),
  business_type: z.enum(['fnb', 'retail', 'fashion', 'service', 'electronics', 'other']),
  phone: z.string().optional(),
})
type SettingsFormValues = z.infer<typeof settingsSchema>

const taxSchema = z.object({
  tax_rate: z.coerce.number().min(0).max(100),
  tax_name: z.string().min(1).max(20),
})
type TaxFormValues = z.infer<typeof taxSchema>

function SettingsPage() {
  const { authUser } = useAuth()
  const tenant = authUser?.tenant
  const [activeTab, setActiveTab] = useState<'store' | 'receipt' | 'security'>('store')

  const storeForm = useForm<SettingsFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      business_name: tenant?.business_name ?? '',
      business_type: (tenant?.business_type as SettingsFormValues['business_type']) ?? 'fnb',
      phone: tenant?.phone ?? '',
    },
  })

  const taxForm = useForm<TaxFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(taxSchema) as any,
    defaultValues: { tax_rate: 0, tax_name: 'PPN' },
  })

  const saveStore = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      if (!authUser?.tenantId) return
      await tenantOnboardingService.updateTenantProfile(authUser.tenantId, {
        businessName: values.business_name,
        businessType: values.business_type,
        phone: values.phone,
      })
    },
    onSuccess: () => toast.success('Pengaturan toko berhasil disimpan'),
    onError: (err: Error) => toast.error(err.message),
  })

  const TABS = [
    { key: 'store' as const, label: 'Info Toko', icon: Store },
    { key: 'receipt' as const, label: 'Struk', icon: Receipt },
    { key: 'security' as const, label: 'Keamanan', icon: Shield },
  ]

  if (!tenant) return null

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Pengaturan" description="Konfigurasi toko dan preferensi aplikasi" />

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Store info tab */}
      {activeTab === 'store' && (
        <div className="max-w-lg">
          <form
            onSubmit={storeForm.handleSubmit(
              (values) => saveStore.mutate(values) as unknown as void
            )}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="biz-name">Nama Toko</Label>
              <Input id="biz-name" {...storeForm.register('business_name')} />
              {storeForm.formState.errors.business_name && (
                <p className="text-xs text-destructive">
                  {storeForm.formState.errors.business_name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Jenis Bisnis</Label>
              <Select
                defaultValue={storeForm.getValues('business_type')}
                onValueChange={(v) =>
                  storeForm.setValue('business_type', v as SettingsFormValues['business_type'])
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="biz-phone">No. Telepon</Label>
              <Input id="biz-phone" type="tel" {...storeForm.register('phone')} />
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={tenant.email} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">Email tidak bisa diubah dari sini.</p>
            </div>

            <Button type="submit" disabled={saveStore.isPending}>
              {saveStore.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </form>
        </div>
      )}

      {/* Receipt tab */}
      {activeTab === 'receipt' && (
        <div className="max-w-lg space-y-6">
          <div>
            <p className="text-sm font-medium mb-1">Pengaturan Pajak</p>
            <p className="text-xs text-muted-foreground mb-4">
              Pajak akan diterapkan ke semua transaksi secara default.
            </p>
            <form
              onSubmit={taxForm.handleSubmit(() => {
                toast.success('Pengaturan pajak disimpan')
              })}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tax-name">Nama Pajak</Label>
                  <Input id="tax-name" placeholder="PPN" {...taxForm.register('tax_name')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tax-rate">Tarif (%)</Label>
                  <Input id="tax-rate" type="number" min={0} max={100} step={0.5} {...taxForm.register('tax_rate')} />
                </div>
              </div>
              <Button type="submit" size="sm">Simpan Pajak</Button>
            </form>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Tampilan Struk</p>
            {[
              { label: 'Tampilkan logo toko', defaultChecked: true },
              { label: 'Tampilkan nama kasir', defaultChecked: true },
              { label: 'Tampilkan catatan transaksi', defaultChecked: false },
            ].map((opt) => (
              <div key={opt.label} className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{opt.label}</p>
                <Switch defaultChecked={opt.defaultChecked} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <div className="max-w-lg space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium">Akses Kasir</p>
            {[
              { label: 'Wajib PIN untuk buka kasir', defaultChecked: false },
              { label: 'Tampilkan harga modal di kasir', defaultChecked: false },
              { label: 'Kasir bisa beri diskon', defaultChecked: true },
              { label: 'Kasir bisa hapus item di keranjang', defaultChecked: true },
            ].map((opt) => (
              <div key={opt.label} className="flex items-center justify-between py-1">
                <p className="text-sm text-muted-foreground">{opt.label}</p>
                <Switch defaultChecked={opt.defaultChecked} />
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Ganti Password</p>
            <p className="text-xs text-muted-foreground">
              Gunakan halaman <strong>Lupa Password</strong> di halaman login untuk mengubah password akun.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="/forgot-password" target="_blank" rel="noreferrer">
                Ke Halaman Reset Password
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
