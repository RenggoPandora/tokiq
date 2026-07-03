import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { AlertTriangle, Package, Pencil, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useStock, useAdjustStock } from '@/hooks/use-stock'
import type { StockWithProduct } from '@/services/stock.service'

export const Route = createFileRoute('/app/stock')({
  component: StockPage,
})

const adjustSchema = z.object({
  newQty: z.coerce.number().int().min(0, 'Stok tidak boleh negatif'),
  reason: z.string().min(1, 'Alasan wajib diisi'),
})
type AdjustForm = z.infer<typeof adjustSchema>

function StockPage() {
  const { data: stocks, isLoading } = useStock()
  const adjustStock = useAdjustStock()
  const [adjustTarget, setAdjustTarget] = useState<StockWithProduct | null>(null)

  const form = useForm<AdjustForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(adjustSchema) as any,
    defaultValues: { newQty: 0, reason: '' },
  })

  function openAdjust(stock: StockWithProduct) {
    setAdjustTarget(stock)
    form.reset({ newQty: stock.quantity, reason: '' })
  }

  async function onSubmit(values: AdjustForm) {
    if (!adjustTarget) return
    await adjustStock.mutateAsync({
      productId: adjustTarget.product_id,
      branchId: adjustTarget.branch_id,
      newQty: values.newQty,
      reason: values.reason,
    })
    setAdjustTarget(null)
  }

  const lowCount = (stocks ?? []).filter((s) => s.quantity <= s.min_stock).length

  const columns: ColumnDef<StockWithProduct>[] = [
    {
      id: 'product',
      header: 'Produk',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">
              {row.original.products?.name ?? '—'}
            </p>
            {row.original.products?.sku && (
              <p className="text-xs text-muted-foreground">SKU: {row.original.products.sku}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Stok',
      cell: ({ row }) => {
        const isLow = row.original.quantity <= row.original.min_stock
        return (
          <div className="flex items-center gap-2">
            <span className={`font-mono font-semibold text-sm ${isLow ? 'text-destructive' : 'text-foreground'}`}>
              {row.original.quantity}
            </span>
            {isLow && (
              <Badge variant="destructive" className="text-[10px] py-0">
                Menipis
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'min_stock',
      header: 'Min. Stok',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.min_stock}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original
        if (s.quantity === 0) return <Badge variant="destructive">Habis</Badge>
        if (s.quantity <= s.min_stock) return <Badge variant="outline" className="text-amber-600 border-amber-300">Menipis</Badge>
        return <Badge variant="secondary">Aman</Badge>
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => openAdjust(row.original)}
        >
          <Pencil className="w-3.5 h-3.5" />
          Sesuaikan
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Stok"
        description={
          lowCount > 0
            ? `${lowCount} produk stok menipis atau habis`
            : 'Semua stok dalam kondisi aman'
        }
      />

      {/* Alert banner */}
      {lowCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>{lowCount} produk</strong> perlu restok segera.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (stocks ?? []).length === 0 ? (
        <EmptyState
          icon={Package}
          title="Belum ada data stok"
          description="Tambahkan produk terlebih dahulu, stok akan otomatis terbuat."
        />
      ) : (
        <DataTable
          columns={columns}
          data={stocks ?? []}
          searchKey="quantity"
          searchPlaceholder="Cari produk..."
          emptyTitle="Tidak ada data stok"
        />
      )}

      {/* Adjust Dialog */}
      <Dialog open={!!adjustTarget} onOpenChange={() => setAdjustTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sesuaikan Stok</DialogTitle>
          </DialogHeader>
          {adjustTarget && (
            <form
              onSubmit={form.handleSubmit(onSubmit as Parameters<typeof form.handleSubmit>[0])}
              className="space-y-4"
            >
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium">{adjustTarget.products?.name ?? '—'}</p>
                <p className="text-xs text-muted-foreground">
                  Stok saat ini: <strong>{adjustTarget.quantity}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-qty">Stok Baru</Label>
                <Input
                  id="new-qty"
                  type="number"
                  min={0}
                  autoFocus
                  {...form.register('newQty')}
                />
                {form.formState.errors.newQty && (
                  <p className="text-xs text-destructive">{form.formState.errors.newQty.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adjust-reason">Alasan Penyesuaian</Label>
                <Input
                  id="adjust-reason"
                  placeholder="contoh: Stok opname, penambahan barang"
                  {...form.register('reason')}
                />
                {form.formState.errors.reason && (
                  <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAdjustTarget(null)}>
                  Batal
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
