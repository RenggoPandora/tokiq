import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Building2, Calendar, CreditCard, Mail, Phone, User } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminTenantDetail, useUpdateTenantStatus, useExtendTrial } from '@/hooks/use-admin'
import { TENANT_STATUS, BUSINESS_TYPES } from '@/lib/constants'
import { formatDate, formatRupiah } from '@/lib/utils'

export const Route = createFileRoute('/admin/tenants/$tenantId')({
  component: TenantDetailPage,
})

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  [TENANT_STATUS.ACTIVE]: { label: 'Aktif', variant: 'default' },
  [TENANT_STATUS.TRIAL]: { label: 'Trial', variant: 'secondary' },
  [TENANT_STATUS.SUSPENDED]: { label: 'Suspended', variant: 'destructive' },
  [TENANT_STATUS.EXPIRED]: { label: 'Expired', variant: 'outline' },
}

function TenantDetailPage() {
  const { tenantId } = Route.useParams()
  const { data: tenant, isLoading } = useAdminTenantDetail(tenantId)
  const updateStatus = useUpdateTenantStatus()
  const extendTrial = useExtendTrial()

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Tenant tidak ditemukan.
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[tenant.status] ?? { label: tenant.status, variant: 'outline' as const }
  const businessTypeLabel = BUSINESS_TYPES.find((b) => b.value === tenant.business_type)?.label ?? tenant.business_type

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back nav */}
      <Link
        to="/admin/tenants"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke daftar tenant
      </Link>

      <PageHeader
        title={tenant.business_name}
        description={`ID: ${tenant.id}`}
        action={
          <div className="flex items-center gap-2">
            {tenant.status === TENANT_STATUS.TRIAL && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => extendTrial.mutate({ id: tenant.id, days: 7 })}
                disabled={extendTrial.isPending}
              >
                Perpanjang Trial
              </Button>
            )}
            {tenant.status !== TENANT_STATUS.SUSPENDED ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => updateStatus.mutate({ id: tenant.id, status: 'suspended' })}
                disabled={updateStatus.isPending}
              >
                Suspend
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => updateStatus.mutate({ id: tenant.id, status: 'active' })}
                disabled={updateStatus.isPending}
              >
                Aktifkan
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Info bisnis */}
        <div className="border border-border rounded-lg p-5 bg-card space-y-4">
          <p className="text-sm font-medium text-foreground">Informasi Bisnis</p>
          <div className="space-y-3">
            <InfoRow icon={Building2} label="Nama Toko" value={tenant.business_name} />
            <InfoRow icon={User} label="Jenis Bisnis" value={businessTypeLabel ?? '—'} />
            <InfoRow icon={Mail} label="Email" value={tenant.email} />
            <InfoRow icon={Phone} label="Telepon" value={tenant.phone ?? '—'} />
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={statusCfg.variant} className="mt-0.5">{statusCfg.label}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Info langganan */}
        <div className="border border-border rounded-lg p-5 bg-card space-y-4">
          <p className="text-sm font-medium text-foreground">Informasi Langganan</p>
          <div className="space-y-3">
            <InfoRow
              icon={CreditCard}
              label="Paket"
              value={tenant.subscription_plans?.name ?? 'Belum berlangganan'}
            />
            <InfoRow
              icon={CreditCard}
              label="Harga/Bulan"
              value={
                tenant.subscription_plans?.price_monthly
                  ? formatRupiah(tenant.subscription_plans.price_monthly)
                  : '—'
              }
            />
            <InfoRow
              icon={Calendar}
              label="Trial Berakhir"
              value={tenant.trial_ends_at ? formatDate(tenant.trial_ends_at, 'dd MMM yyyy') : '—'}
            />
            <InfoRow
              icon={Calendar}
              label="Langganan Berakhir"
              value={
                tenant.subscription_ends_at
                  ? formatDate(tenant.subscription_ends_at, 'dd MMM yyyy')
                  : '—'
              }
            />
            <InfoRow
              icon={Calendar}
              label="Bergabung"
              value={formatDate(tenant.created_at, 'dd MMM yyyy')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}
