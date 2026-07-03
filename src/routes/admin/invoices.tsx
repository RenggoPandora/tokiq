import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminInvoices, useConfirmPayment, useRejectPayment } from '@/hooks/use-admin'
import type { InvoiceWithTenant } from '@/services/admin.service'
import { INVOICE_STATUS } from '@/lib/constants'
import { formatDate, formatRupiah } from '@/lib/utils'

export const Route = createFileRoute('/admin/invoices')({
  component: AdminInvoicesPage,
})

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  [INVOICE_STATUS.PENDING]: { label: 'Menunggu', variant: 'secondary' },
  [INVOICE_STATUS.PAID]: { label: 'Lunas', variant: 'default' },
  [INVOICE_STATUS.EXPIRED]: { label: 'Expired', variant: 'outline' },
  [INVOICE_STATUS.CANCELLED]: { label: 'Ditolak', variant: 'destructive' },
}

function AdminInvoicesPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmInvoice, setConfirmInvoice] = useState<InvoiceWithTenant | null>(null)
  const [rejectInvoice, setRejectInvoice] = useState<InvoiceWithTenant | null>(null)

  const { data: invoices, isLoading } = useAdminInvoices(statusFilter || undefined)
  const confirmPayment = useConfirmPayment()
  const rejectPayment = useRejectPayment()

  const columns: ColumnDef<InvoiceWithTenant>[] = [
    {
      id: 'tenant',
      header: 'Tenant',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground text-sm">
            {row.original.tenants?.business_name ?? '—'}
          </p>
          <p className="text-xs text-muted-foreground">{row.original.tenants?.email}</p>
        </div>
      ),
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
      accessorKey: 'amount',
      header: 'Jumlah',
      cell: ({ row }) => (
        <span className="font-medium text-sm">{formatRupiah(row.original.amount)}</span>
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
      id: 'period',
      header: 'Periode',
      cell: ({ row }) => {
        const { period_start, period_end } = row.original
        if (!period_start || !period_end) return <span className="text-muted-foreground text-xs">—</span>
        return (
          <span className="text-xs text-muted-foreground">
            {formatDate(period_start, 'dd MMM')} – {formatDate(period_end, 'dd MMM yyyy')}
          </span>
        )
      },
    },
    {
      id: 'proof',
      header: 'Bukti',
      cell: ({ row }) =>
        row.original.payment_proof_url ? (
          <a
            href={row.original.payment_proof_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Lihat
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: 'date',
      header: 'Tanggal',
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
        const inv = row.original
        if (inv.status !== INVOICE_STATUS.PENDING) return null
        return (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => setConfirmInvoice(inv)}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Konfirmasi
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
              onClick={() => setRejectInvoice(inv)}
            >
              <XCircle className="w-3.5 h-3.5" />
              Tolak
            </Button>
          </div>
        )
      },
    },
  ]

  // Hitung pending count
  const pendingCount = (invoices ?? []).filter((i) => i.status === INVOICE_STATUS.PENDING).length

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Pembayaran"
        description={pendingCount > 0 ? `${pendingCount} menunggu konfirmasi` : 'Semua pembayaran tercatat'}
      />

      {/* Status filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { value: '', label: 'Semua' },
          { value: INVOICE_STATUS.PENDING, label: 'Menunggu' },
          { value: INVOICE_STATUS.PAID, label: 'Lunas' },
          { value: INVOICE_STATUS.CANCELLED, label: 'Ditolak' },
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

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={invoices ?? []}
          emptyTitle="Belum ada invoice"
          emptyDescription="Belum ada riwayat pembayaran."
        />
      )}

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmInvoice} onOpenChange={() => setConfirmInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi pembayaran ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Pembayaran sebesar{' '}
              <strong>{confirmInvoice ? formatRupiah(confirmInvoice.amount) : ''}</strong> dari{' '}
              <strong>{confirmInvoice?.tenants?.business_name}</strong> akan dikonfirmasi.
              Status tenant akan otomatis diubah menjadi aktif.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmInvoice) confirmPayment.mutate(confirmInvoice.id)
                setConfirmInvoice(null)
              }}
            >
              Ya, Konfirmasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog */}
      <AlertDialog open={!!rejectInvoice} onOpenChange={() => setRejectInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak pembayaran ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Invoice dari <strong>{rejectInvoice?.tenants?.business_name}</strong> akan ditandai
              sebagai ditolak. Tenant akan diberitahu untuk mengirim ulang bukti transfer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (rejectInvoice) rejectPayment.mutate(rejectInvoice.id)
                setRejectInvoice(null)
              }}
            >
              Ya, Tolak
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
