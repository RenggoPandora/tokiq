import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  MoreHorizontal, ExternalLink, ShieldOff, ShieldCheck,
  Clock, Search, Download,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminTenants, useUpdateTenantStatus, useExtendTrial } from '@/hooks/use-admin'
import type { TenantWithPlan } from '@/types/app.types'
import { TENANT_STATUS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { exportToExcel } from '@/lib/excel'

export const Route = createFileRoute('/admin/tenants')({
  component: AdminTenantsPage,
})

// Status badge config
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  [TENANT_STATUS.ACTIVE]: { label: 'Aktif', variant: 'default' },
  [TENANT_STATUS.TRIAL]: { label: 'Trial', variant: 'secondary' },
  [TENANT_STATUS.SUSPENDED]: { label: 'Suspend', variant: 'destructive' },
  [TENANT_STATUS.EXPIRED]: { label: 'Expired', variant: 'outline' },
}

function AdminTenantsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'activate' | 'extend'
    tenant: TenantWithPlan
  } | null>(null)
  const navigate = useNavigate()

  const { data: tenants, isLoading } = useAdminTenants({
    search: search || undefined,
    status: statusFilter || undefined,
  })

  const updateStatus = useUpdateTenantStatus()
  const extendTrial = useExtendTrial()

  function handleConfirm() {
    if (!confirmAction) return
    const { type, tenant } = confirmAction

    if (type === 'suspend') updateStatus.mutate({ id: tenant.id, status: 'suspended' })
    if (type === 'activate') updateStatus.mutate({ id: tenant.id, status: 'active' })
    if (type === 'extend') extendTrial.mutate({ id: tenant.id, days: 7 })

    setConfirmAction(null)
  }

  const columns: ColumnDef<TenantWithPlan>[] = [
    {
      accessorKey: 'business_name',
      header: 'Toko',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground text-sm">{row.original.business_name}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const cfg = STATUS_CONFIG[row.original.status] ?? { label: row.original.status, variant: 'outline' as const }
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>
      },
    },
    {
      id: 'plan',
      header: 'Paket',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.subscription_plans?.name ?? '—'}
        </span>
      ),
    },
    {
      id: 'expires',
      header: 'Berakhir',
      cell: ({ row }) => {
        const date = row.original.subscription_ends_at ?? row.original.trial_ends_at
        return (
          <span className="text-sm text-muted-foreground">
            {date ? formatDate(date, 'dd MMM yyyy') : '—'}
          </span>
        )
      },
    },
    {
      id: 'joined',
      header: 'Bergabung',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.created_at, 'dd MMM yyyy')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const t = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Aksi</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigate({ to: '/admin/tenants/$tenantId', params: { tenantId: t.id } })}
              >
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Lihat Detail
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {t.status === TENANT_STATUS.TRIAL && (
                <DropdownMenuItem
                  onClick={() => setConfirmAction({ type: 'extend', tenant: t })}
                >
                  <Clock className="mr-2 h-3.5 w-3.5" />
                  Perpanjang Trial 7 Hari
                </DropdownMenuItem>
              )}
              {t.status !== TENANT_STATUS.SUSPENDED && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmAction({ type: 'suspend', tenant: t })}
                >
                  <ShieldOff className="mr-2 h-3.5 w-3.5" />
                  Suspend Akun
                </DropdownMenuItem>
              )}
              {t.status === TENANT_STATUS.SUSPENDED && (
                <DropdownMenuItem
                  onClick={() => setConfirmAction({ type: 'activate', tenant: t })}
                >
                  <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                  Aktifkan Kembali
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  function handleExport() {
    if (!tenants?.length) return
    exportToExcel(
      tenants.map((t) => ({
        'Nama Toko': t.business_name,
        Email: t.email,
        Status: t.status,
        Paket: t.subscription_plans?.name ?? '—',
        'Trial Berakhir': t.trial_ends_at ?? '—',
        'Langganan Berakhir': t.subscription_ends_at ?? '—',
        'Bergabung': t.created_at.slice(0, 10),
      })),
      `daftar-tenant-${new Date().toISOString().slice(0, 10)}`,
      'Tenant'
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Tenant"
        description={`${tenants?.length ?? 0} total subscriber`}
        action={
          <Button size="sm" variant="outline" onClick={handleExport} disabled={!tenants?.length}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama toko atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { value: '', label: 'Semua' },
            { value: TENANT_STATUS.ACTIVE, label: 'Aktif' },
            { value: TENANT_STATUS.TRIAL, label: 'Trial' },
            { value: TENANT_STATUS.SUSPENDED, label: 'Suspend' },
            { value: TENANT_STATUS.EXPIRED, label: 'Expired' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                statusFilter === opt.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={tenants ?? []}
          emptyTitle="Belum ada tenant"
          emptyDescription="Belum ada subscriber yang terdaftar di platform ini."
        />
      )}

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'suspend' && 'Suspend akun ini?'}
              {confirmAction?.type === 'activate' && 'Aktifkan kembali akun ini?'}
              {confirmAction?.type === 'extend' && 'Perpanjang trial 7 hari?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'suspend' &&
                `Akun ${confirmAction.tenant.business_name} akan disuspend dan tidak bisa mengakses aplikasi.`}
              {confirmAction?.type === 'activate' &&
                `Akun ${confirmAction.tenant.business_name} akan diaktifkan kembali.`}
              {confirmAction?.type === 'extend' &&
                `Trial ${confirmAction.tenant.business_name} akan diperpanjang 7 hari dari tanggal sekarang.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={confirmAction?.type === 'suspend' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {confirmAction?.type === 'suspend' && 'Ya, Suspend'}
              {confirmAction?.type === 'activate' && 'Ya, Aktifkan'}
              {confirmAction?.type === 'extend' && 'Ya, Perpanjang'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
