import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Plus, Pencil, Trash2, UserCircle, Loader2, Phone, Mail, Star, MoreHorizontal,
} from 'lucide-react'
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/hooks/use-customers'
import type { Customer } from '@/types/app.types'

export const Route = createFileRoute('/app/customers')({
  component: CustomersPage,
})

const customerSchema = z.object({
  name: z.string().min(1, 'Nama pelanggan wajib diisi').max(100),
  phone: z.string().optional(),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  customer_group: z.enum(['regular', 'member', 'vip']),
})
type CustomerFormValues = z.infer<typeof customerSchema>

const GROUP_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  regular: { label: 'Regular', variant: 'outline' },
  member: { label: 'Member', variant: 'secondary' },
  vip: { label: 'VIP', variant: 'default' },
}

function CustomersPage() {
  const { data: customers, isLoading } = useCustomers()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  const [openForm, setOpenForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Customer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  const form = useForm<CustomerFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(customerSchema) as any,
    defaultValues: { name: '', phone: '', email: '', customer_group: 'regular' },
  })

  function openCreate() {
    setEditTarget(null)
    form.reset({ name: '', phone: '', email: '', customer_group: 'regular' })
    setOpenForm(true)
  }

  function openEdit(c: Customer) {
    setEditTarget(c)
    form.reset({
      name: c.name,
      phone: c.phone ?? '',
      email: c.email ?? '',
      customer_group: c.customer_group as CustomerFormValues['customer_group'],
    })
    setOpenForm(true)
  }

  async function onSubmit(values: CustomerFormValues) {
    const dto = {
      name: values.name,
      phone: values.phone || null,
      email: values.email || null,
      customer_group: values.customer_group,
    }
    if (editTarget) {
      await updateCustomer.mutateAsync({ id: editTarget.id, dto })
    } else {
      await createCustomer.mutateAsync(dto)
    }
    setOpenForm(false)
  }

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'name',
      header: 'Nama',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground">
            {row.original.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm">{row.original.name}</p>
            {row.original.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="w-3 h-3" />
                {row.original.phone}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Email',
      cell: ({ row }) =>
        row.original.email ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="w-3 h-3" />
            {row.original.email}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'customer_group',
      header: 'Grup',
      cell: ({ row }) => {
        const cfg = GROUP_CONFIG[row.original.customer_group] ?? GROUP_CONFIG.regular
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>
      },
    },
    {
      accessorKey: 'points',
      header: 'Poin',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm">
          <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-mono">{row.original.points}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const c = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(c)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteTarget(c)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />Hapus
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
        title="Pelanggan"
        description={`${customers?.length ?? 0} pelanggan terdaftar`}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />Tambah Pelanggan
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : (customers ?? []).length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="Belum ada pelanggan"
          description="Tambahkan pelanggan untuk melacak riwayat pembelian dan poin."
          action={<Button size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Tambah Pelanggan</Button>}
        />
      ) : (
        <DataTable
          columns={columns}
          data={customers ?? []}
          searchKey="name"
          searchPlaceholder="Cari nama pelanggan..."
        />
      )}

      {/* Form */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit as Parameters<typeof form.handleSubmit>[0])}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="cust-name">Nama <span className="text-destructive">*</span></Label>
              <Input id="cust-name" placeholder="Budi Santoso" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-phone">No. HP</Label>
              <Input id="cust-phone" type="tel" placeholder="08xxx" {...form.register('phone')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-email">Email</Label>
              <Input id="cust-email" type="email" placeholder="budi@email.com" {...form.register('email')} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Grup Pelanggan</Label>
              <Select
                defaultValue={form.getValues('customer_group')}
                onValueChange={(v) => form.setValue('customer_group', v as CustomerFormValues['customer_group'])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(GROUP_CONFIG).map(([val, cfg]) => (
                    <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>Batal</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editTarget ? 'Simpan' : 'Tambahkan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pelanggan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Data <strong>{deleteTarget?.name}</strong> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) deleteCustomer.mutate(deleteTarget.id); setDeleteTarget(null) }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
