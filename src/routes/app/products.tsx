import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, MoreHorizontal, Pencil, Trash2, Package, ToggleLeft, ToggleRight } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useProducts, useDeleteProduct, useToggleProductActive, useCategories,
} from '@/hooks/use-products'
import { ProductForm } from '@/components/products/product-form'
import type { ProductWithCategory } from '@/types/app.types'
import { formatRupiah } from '@/lib/utils'

export const Route = createFileRoute('/app/products')({
  component: ProductsPage,
})

function ProductsPage() {
  const [categoryFilter, setCategoryFilter] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editTarget, setEditTarget] = useState<ProductWithCategory | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductWithCategory | null>(null)

  const { data: products, isLoading } = useProducts({
    categoryId: categoryFilter || undefined,
  })
  const { data: categories } = useCategories()
  const deleteProduct = useDeleteProduct()
  const toggleActive = useToggleProductActive()

  function openCreate() {
    setEditTarget(null)
    setOpenForm(true)
  }

  function openEdit(product: ProductWithCategory) {
    setEditTarget(product)
    setOpenForm(true)
  }

  const columns: ColumnDef<ProductWithCategory>[] = [
    {
      accessorKey: 'name',
      header: 'Produk',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.image_url ? (
            <img
              src={row.original.image_url}
              alt={row.original.name}
              className="w-9 h-9 rounded-md object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium text-sm text-foreground">{row.original.name}</p>
            {row.original.sku && (
              <p className="text-xs text-muted-foreground">SKU: {row.original.sku}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Kategori',
      cell: ({ row }) => {
        const cat = row.original.categories
        if (!cat) return <span className="text-xs text-muted-foreground">—</span>
        return (
          <Badge
            variant="secondary"
            style={cat.color ? { backgroundColor: `${cat.color}20`, color: cat.color } : {}}
          >
            {cat.name}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'sell_price',
      header: 'Harga Jual',
      cell: ({ row }) => (
        <span className="font-medium text-sm">{formatRupiah(row.original.sell_price)}</span>
      ),
    },
    {
      accessorKey: 'cost_price',
      header: 'Harga Modal',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.cost_price ? formatRupiah(row.original.cost_price) : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const p = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Aksi</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(p)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit Produk
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toggleActive.mutate({ id: p.id, isActive: !p.is_active })}
              >
                {p.is_active ? (
                  <><ToggleLeft className="mr-2 h-3.5 w-3.5" />Nonaktifkan</>
                ) : (
                  <><ToggleRight className="mr-2 h-3.5 w-3.5" />Aktifkan</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteTarget(p)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Produk"
        description={`${products?.length ?? 0} produk terdaftar`}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk
          </Button>
        }
      />

      {/* Category filter chips */}
      {(categories ?? []).length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              categoryFilter === ''
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted'
            }`}
          >
            Semua
          </button>
          {(categories ?? []).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted'
              }`}
            >
              {cat.icon && <span className="mr-1">{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (products ?? []).length === 0 && !categoryFilter ? (
        <EmptyState
          icon={Package}
          title="Belum ada produk"
          description="Tambahkan produk pertama untuk mulai berjualan."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Produk
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={products ?? []}
          searchKey="name"
          searchPlaceholder="Cari produk..."
          emptyTitle="Tidak ada produk"
          emptyDescription="Tidak ada produk yang cocok dengan filter ini."
        />
      )}

      {/* Product Form */}
      <ProductForm
        open={openForm}
        onOpenChange={setOpenForm}
        editTarget={editTarget}
        categories={categories ?? []}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus produk ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Produk <strong>{deleteTarget?.name}</strong> akan dihapus permanen beserta data
              variannya. Data transaksi yang sudah ada tidak akan terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteProduct.mutate(deleteTarget.id)
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
