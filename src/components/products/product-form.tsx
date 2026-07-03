import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-products'
import { productSchema, type ProductFormValues } from '@/lib/validations/product.schema'
import type { Category, ProductWithCategory } from '@/types/app.types'

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTarget: ProductWithCategory | null
  categories: Category[]
}

export function ProductForm({ open, onOpenChange, editTarget, categories }: ProductFormProps) {
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const form = useForm<ProductFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      category_id: null,
      sku: '',
      barcode: '',
      description: '',
      sell_price: 0,
      cost_price: 0,
      has_variants: false,
      has_addons: false,
      is_active: true,
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (editTarget) {
      form.reset({
        name: editTarget.name,
        category_id: editTarget.category_id ?? null,
        sku: editTarget.sku ?? '',
        barcode: editTarget.barcode ?? '',
        description: editTarget.description ?? '',
        sell_price: editTarget.sell_price,
        cost_price: editTarget.cost_price ?? 0,
        has_variants: editTarget.has_variants,
        has_addons: editTarget.has_addons,
        is_active: editTarget.is_active,
      })
    } else {
      form.reset({
        name: '',
        category_id: null,
        sku: '',
        barcode: '',
        description: '',
        sell_price: 0,
        cost_price: 0,
        has_variants: false,
        has_addons: false,
        is_active: true,
      })
    }
  }, [editTarget, open, form])

  async function onSubmit(values: ProductFormValues) {
    const dto = {
      name: values.name,
      category_id: values.category_id || null,
      sku: values.sku || null,
      barcode: values.barcode || null,
      description: values.description || null,
      sell_price: values.sell_price,
      cost_price: values.cost_price ?? 0,
      has_variants: values.has_variants,
      has_addons: values.has_addons,
      is_active: values.is_active,
    }

    if (editTarget) {
      await updateProduct.mutateAsync({ id: editTarget.id, dto })
    } else {
      await createProduct.mutateAsync(dto)
    }
    onOpenChange(false)
  }

  const isPending = createProduct.isPending || updateProduct.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTarget ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit as Parameters<typeof form.handleSubmit>[0])}
          className="space-y-4"
        >
          {/* Nama */}
          <div className="space-y-1.5">
            <Label htmlFor="prod-name">Nama Produk <span className="text-destructive">*</span></Label>
            <Input id="prod-name" placeholder="contoh: Nasi Goreng Spesial" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Kategori */}
          <div className="space-y-1.5">
            <Label htmlFor="prod-category">Kategori</Label>
            <Select
              value={form.watch('category_id') ?? '__none__'}
              onValueChange={(v) =>
                form.setValue('category_id', v === '__none__' ? null : v, { shouldValidate: true })
              }
            >
              <SelectTrigger id="prod-category">
                <SelectValue placeholder="Pilih kategori (opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Tanpa Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Harga */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prod-sell-price">Harga Jual (Rp) <span className="text-destructive">*</span></Label>
              <Input
                id="prod-sell-price"
                type="number"
                min={0}
                step={500}
                {...form.register('sell_price')}
              />
              {form.formState.errors.sell_price && (
                <p className="text-xs text-destructive">{form.formState.errors.sell_price.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-cost-price">Harga Modal (Rp)</Label>
              <Input
                id="prod-cost-price"
                type="number"
                min={0}
                step={500}
                {...form.register('cost_price')}
              />
            </div>
          </div>

          {/* SKU & Barcode */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prod-sku">SKU</Label>
              <Input id="prod-sku" placeholder="opsional" {...form.register('sku')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-barcode">Barcode</Label>
              <Input id="prod-barcode" placeholder="opsional" {...form.register('barcode')} />
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <Label htmlFor="prod-desc">Deskripsi</Label>
            <Textarea
              id="prod-desc"
              rows={3}
              placeholder="Deskripsi produk (opsional)"
              className="resize-none"
              {...form.register('description')}
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Produk Aktif</p>
                <p className="text-xs text-muted-foreground">Tampil di kasir dan pencarian</p>
              </div>
              <Switch
                checked={form.watch('is_active')}
                onCheckedChange={(v) => form.setValue('is_active', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Punya Varian</p>
                <p className="text-xs text-muted-foreground">ukuran, warna, dll</p>
              </div>
              <Switch
                checked={form.watch('has_variants')}
                onCheckedChange={(v) => form.setValue('has_variants', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Punya Add-on / Topping</p>
                <p className="text-xs text-muted-foreground">untuk FnB</p>
              </div>
              <Switch
                checked={form.watch('has_addons')}
                onCheckedChange={(v) => form.setValue('has_addons', v)}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editTarget ? 'Simpan Perubahan' : 'Tambah Produk'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
