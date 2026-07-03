import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAdminPlans, useCreatePlan, useUpdatePlan,
  useTogglePlanActive, useDeletePlan,
} from '@/hooks/use-admin'
import { planSchema, type PlanFormValues } from '@/lib/validations/plan.schema'
import type { SubscriptionPlan } from '@/types/app.types'
import { formatRupiah } from '@/lib/utils'

export const Route = createFileRoute('/admin/plans')({
  component: AdminPlansPage,
})

function AdminPlansPage() {
  const { data: plans, isLoading } = useAdminPlans()
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()
  const toggleActive = useTogglePlanActive()
  const deletePlan = useDeletePlan()

  const [openForm, setOpenForm] = useState(false)
  const [editTarget, setEditTarget] = useState<SubscriptionPlan | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null)

  const form = useForm<PlanFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(planSchema) as any,
    defaultValues: {
      name: '',
      price_monthly: 0,
      price_yearly: null,
      trial_days: 14,
      is_active: true,
      features: '',
    },
  })

  function openCreate() {
    setEditTarget(null)
    form.reset({
      name: '',
      price_monthly: 0,
      price_yearly: null,
      trial_days: 14,
      is_active: true,
      features: '',
    })
    setOpenForm(true)
  }

  function openEdit(plan: SubscriptionPlan) {
    setEditTarget(plan)
    form.reset({
      name: plan.name,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly ?? null,
      trial_days: plan.trial_days,
      is_active: plan.is_active,
      features: plan.features ? JSON.stringify(plan.features) : '',
    })
    setOpenForm(true)
  }

  async function onSubmit(values: PlanFormValues) {
    let parsedFeatures: unknown = null
    if (values.features) {
      try {
        parsedFeatures = JSON.parse(values.features)
      } catch {
        parsedFeatures = values.features.split('\n').filter(Boolean)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dto: any = {
      name: values.name,
      price_monthly: values.price_monthly,
      price_yearly: values.price_yearly ?? null,
      trial_days: values.trial_days,
      is_active: values.is_active,
      features: parsedFeatures,
    }

    if (editTarget) {
      await updatePlan.mutateAsync({ id: editTarget.id, dto })
    } else {
      await createPlan.mutateAsync(dto)
    }
    setOpenForm(false)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Paket & Pricing"
        description="Kelola paket langganan platform"
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Paket
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(plans ?? []).map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={() => openEdit(plan)}
              onDelete={() => setDeleteTarget(plan)}
              onToggleActive={(v) => toggleActive.mutate({ id: plan.id, isActive: v })}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Paket' : 'Tambah Paket Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit as Parameters<typeof form.handleSubmit>[0])} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Paket</Label>
              <Input id="name" placeholder="contoh: Starter" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price_monthly">Harga/Bulan (Rp)</Label>
                <Input
                  id="price_monthly"
                  type="number"
                  min={0}
                  {...form.register('price_monthly')}
                />
                {form.formState.errors.price_monthly && (
                  <p className="text-xs text-destructive">{form.formState.errors.price_monthly.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price_yearly">Harga/Tahun (Rp)</Label>
                <Input
                  id="price_yearly"
                  type="number"
                  min={0}
                  placeholder="Opsional"
                  {...form.register('price_yearly')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="trial_days">Durasi Trial (hari)</Label>
              <Input id="trial_days" type="number" min={0} {...form.register('trial_days')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="features">Fitur (satu per baris atau JSON)</Label>
              <textarea
                id="features"
                rows={4}
                placeholder={'Kasir offline\nMulti cabang\nLaporan lengkap'}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                {...form.register('features')}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is_active"
                checked={form.watch('is_active')}
                onCheckedChange={(v) => form.setValue('is_active', v)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Paket aktif (tampil di pricing page)
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editTarget ? 'Simpan' : 'Tambahkan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus paket ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Paket <strong>{deleteTarget?.name}</strong> akan dihapus permanen. Tenant yang sedang
              menggunakan paket ini tidak terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deletePlan.mutate(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ===========================
// Plan Card Component
// ===========================

interface PlanCardProps {
  plan: SubscriptionPlan
  onEdit: () => void
  onDelete: () => void
  onToggleActive: (v: boolean) => void
}

function PlanCard({ plan, onEdit, onDelete, onToggleActive }: PlanCardProps) {
  const features = Array.isArray(plan.features)
    ? (plan.features as string[])
    : typeof plan.features === 'object' && plan.features !== null
    ? Object.values(plan.features as Record<string, string>)
    : []

  return (
    <div className="border border-border rounded-lg p-5 bg-card flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-foreground">{plan.name}</p>
            {!plan.is_active && (
              <Badge variant="secondary" className="text-[10px]">Nonaktif</Badge>
            )}
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatRupiah(plan.price_monthly)}
            <span className="text-sm font-normal text-muted-foreground">/bln</span>
          </p>
          {plan.price_yearly && (
            <p className="text-xs text-muted-foreground">
              {formatRupiah(plan.price_yearly)}/tahun
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Trial: {plan.trial_days} hari
      </div>

      {features.length > 0 && (
        <ul className="space-y-1">
          {features.slice(0, 5).map((f, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
              {String(f)}
            </li>
          ))}
          {features.length > 5 && (
            <li className="text-xs text-muted-foreground">+{features.length - 5} lainnya</li>
          )}
        </ul>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-border mt-auto">
        <span className="text-xs text-muted-foreground">
          {plan.is_active ? 'Tampil di pricing page' : 'Tersembunyi'}
        </span>
        <Switch
          checked={plan.is_active}
          onCheckedChange={onToggleActive}
          aria-label={`Toggle ${plan.name}`}
        />
      </div>
    </div>
  )
}
