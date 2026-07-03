import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Trash2, Loader2, Layers } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
} from '@/hooks/use-products'
import { categorySchema, type CategoryFormValues } from '@/lib/validations/product.schema'
import type { Category } from '@/types/app.types'

export const Route = createFileRoute('/app/categories')({
  component: CategoriesPage,
})

// Preset warna kategori
const COLOR_PRESETS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#0ea5e9',
]

function CategoriesPage() {
  const { data: categories, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [openForm, setOpenForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const form = useForm<CategoryFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(categorySchema) as any,
    defaultValues: { name: '', color: '#6b7280', icon: '', sort_order: 0 },
  })

  function openCreate() {
    setEditTarget(null)
    form.reset({ name: '', color: '#6b7280', icon: '', sort_order: categories?.length ?? 0 })
    setOpenForm(true)
  }

  function openEdit(cat: Category) {
    setEditTarget(cat)
    form.reset({
      name: cat.name,
      color: cat.color ?? '#6b7280',
      icon: cat.icon ?? '',
      sort_order: cat.sort_order,
    })
    setOpenForm(true)
  }

  async function onSubmit(values: CategoryFormValues) {
    const dto = {
      name: values.name,
      color: values.color || null,
      icon: values.icon || null,
      sort_order: values.sort_order,
    }
    if (editTarget) {
      await updateCategory.mutateAsync({ id: editTarget.id, dto })
    } else {
      await createCategory.mutateAsync(dto)
    }
    setOpenForm(false)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Kategori"
        description="Kelola kategori untuk mengorganisir produk"
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kategori
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : (categories ?? []).length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Belum ada kategori"
          description="Buat kategori untuk mengelompokkan produkmu."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Kategori
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {(categories ?? []).map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 border border-border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors"
            >
              {/* Color dot */}
              <div
                className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: cat.color ?? '#6b7280' }}
              >
                {cat.icon ? (
                  <span>{cat.icon}</span>
                ) : (
                  <span>{cat.name.charAt(0).toUpperCase()}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{cat.name}</p>
                <p className="text-xs text-muted-foreground">Urutan: {cat.sort_order}</p>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(cat)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit as Parameters<typeof form.handleSubmit>[0])}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Nama Kategori</Label>
              <Input id="cat-name" placeholder="contoh: Makanan" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Warna</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => form.setValue('color', c)}
                    className="w-7 h-7 rounded-md ring-offset-2 transition-all"
                    style={{
                      backgroundColor: c,
                      outline: form.watch('color') === c ? `2px solid ${c}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cat-icon">Icon / Emoji (opsional)</Label>
                <Input id="cat-icon" placeholder="🍔" {...form.register('icon')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-order">Urutan</Label>
                <Input id="cat-order" type="number" min={0} {...form.register('sort_order')} />
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: form.watch('color') ?? '#6b7280' }}
              >
                {form.watch('icon') || (form.watch('name')?.charAt(0)?.toUpperCase() ?? '?')}
              </div>
              <span className="text-sm font-medium">{form.watch('name') || 'Nama Kategori'}</span>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
            <AlertDialogTitle>Hapus kategori ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori <strong>{deleteTarget?.name}</strong> akan dihapus. Produk yang menggunakan
              kategori ini tidak akan terhapus, tetapi kategorinya akan kosong.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteCategory.mutate(deleteTarget.id)
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
