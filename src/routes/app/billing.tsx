import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, Calendar, CheckCircle, AlertCircle, Clock, Upload } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { MetricCard } from '@/components/shared/metric-card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth.context'
import { formatDate, formatRupiah } from '@/lib/utils'
import { TENANT_STATUS, INVOICE_STATUS } from '@/lib/constants'
import type { Invoice, SubscriptionPlan } from '@/types/app.types'

export const Route = createFileRoute('/app/billing')({
  component: BillingPage,
})

interface InvoiceWithPlan extends Invoice {
  subscription_plans: Pick<SubscriptionPlan, 'name'> | null
}

const TENANT_STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  [TENANT_STATUS.ACTIVE]: { label: 'Aktif', icon: CheckCircle, variant: 'default' },
  [TENANT_STATUS.TRIAL]: { label: 'Trial', icon: Clock, variant: 'secondary' },
  [TENANT_STATUS.SUSPENDED]: { label: 'Suspended', icon: AlertCircle, variant: 'destructive' },
  [TENANT_STATUS.EXPIRED]: { label: 'Expired', icon: AlertCircle, variant: 'outline' },
}

const INVOICE_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  [INVOICE_STATUS.PENDING]: { label: 'Menunggu Konfirmasi', variant: 'secondary' },
  [INVOICE_STATUS.PAID]: { label: 'Lunas', variant: 'default' },
  [INVOICE_STATUS.EXPIRED]: { label: 'Expired', variant: 'outline' },
  [INVOICE_STATUS.CANCELLED]: { label: 'Ditolak', variant: 'destructive' },
}

function BillingPage() {
  const { authUser } = useAuth()
  const tenant = authUser?.tenant
  const tenantId = authUser?.tenantId ?? ''

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, subscription_plans(name)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return (data ?? []) as unknown as InvoiceWithPlan[]
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  })

  if (!tenant) return null

  const statusCfg = TENANT_STATUS_CONFIG[tenant.status] ?? TENANT_STATUS_CONFIG.expired
  const StatusIcon = statusCfg.icon

  const expiresAt = tenant.subscription_ends_at ?? tenant.trial_ends_at
  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Langganan"
        description="Status dan riwayat pembayaran akun kamu"
      />

      {/* Status card */}
      <div className="border border-border rounded-lg p-5 bg-card">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <StatusIcon className="w-4 h-4 shrink-0" />
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{tenant.business_name}</p>
              <p className="text-xs text-muted-foreground">{tenant.email}</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            {expiresAt && (
              <>
                <p className="text-xs text-muted-foreground">
                  {tenant.status === TENANT_STATUS.TRIAL ? 'Trial berakhir' : 'Langganan berakhir'}
                </p>
                <p className="text-sm font-medium">{formatDate(expiresAt, 'dd MMM yyyy')}</p>
                {daysLeft !== null && (
                  <p className={`text-xs font-medium ${daysLeft <= 7 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {daysLeft > 0 ? `${daysLeft} hari lagi` : 'Sudah berakhir'}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Expiry warning */}
        {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
          <div className="mt-4 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Langgananmu berakhir dalam <strong>{daysLeft} hari</strong>. Segera perbarui untuk tidak terputus.
            </p>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Status"
          value={statusCfg.label}
          subtitle="Status akun saat ini"
          icon={CreditCard}
        />
        <MetricCard
          title="Sisa Hari"
          value={daysLeft !== null ? `${daysLeft} hari` : '—'}
          subtitle={tenant.status === TENANT_STATUS.TRIAL ? 'Masa trial' : 'Masa langganan'}
          icon={Calendar}
          variant={daysLeft !== null && daysLeft <= 7 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Invoice"
          value={(invoices ?? []).filter((i) => i.status === INVOICE_STATUS.PENDING).length}
          subtitle="Menunggu konfirmasi"
          icon={AlertCircle}
        />
      </div>

      {/* Invoice history */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-medium">Riwayat Pembayaran</p>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (invoices ?? []).length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            Belum ada riwayat pembayaran.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(invoices ?? []).map((inv) => {
              const cfg = INVOICE_STATUS_CONFIG[inv.status] ?? INVOICE_STATUS_CONFIG.pending
              return (
                <div key={inv.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{inv.subscription_plans?.name ?? 'Langganan'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(inv.created_at, 'dd MMM yyyy')}
                      {inv.period_start && inv.period_end && (
                        <span>
                          {' '}· {formatDate(inv.period_start, 'dd MMM')}–{formatDate(inv.period_end, 'dd MMM yyyy')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatRupiah(inv.amount)}</p>
                    <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Upload proof CTA */}
      <div className="border border-dashed border-border rounded-lg p-6 text-center">
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium mb-1">Upload Bukti Transfer</p>
        <p className="text-xs text-muted-foreground mb-3">
          Jika sudah transfer, upload bukti agar admin dapat mengkonfirmasi pembayaranmu.
        </p>
        <Button variant="outline" size="sm" disabled>
          Upload Bukti (Segera Hadir)
        </Button>
      </div>
    </div>
  )
}
