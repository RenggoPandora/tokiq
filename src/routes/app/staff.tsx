import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Plus, Pencil, Trash2, Users, Loader2, MoreHorizontal, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
import { staffService } from '@/services/staff.service'
import { useTenant } from '@/hooks/use-tenant'
import type { TenantUser } from '@/types/app.types'

export const Route = createFileRoute('/app/staff')({
  component: StaffPage,
})

const staffSchema = z.object({
  name: z.string().min(1, 'Nama staff wajib diisi').max(100),
  role: z.enum(['owner', 'manager', 'cashier', 'warehouse']),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  pin: z.string().length(6, 'PIN harus 6 digit').regex(/^\d+$/, 'PIN harus angka').optional().or(z.literal('')),
})

const staffEditSchema = z.object({
  name: z.string().min(1, 'Nama staff wajib diisi').max(100),
  role: z.enum(['owner', 'manager', 'cashier', 'warehouse']),
  pin: z.string().length(6, 'PIN harus 6 digit').regex(/^\d+$/, 'PIN harus angka').optional().or(z.literal('')),
})

type StaffFormValues = z.infer<typeof staffSchema>
type StaffEditFormValues = z.infer<typeof staffEditSchema>

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manajer',
  cashier: 'Kasir',
  warehouse: 'Gudang',
}

function StaffPage() {
  const { tenantId } = useTenant()
  const queryClient = useQueryClient()

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', tenantId],
    queryFn: () => staffService.getAll(tenantId),
    staleTime: 5 * 60 * 1000,
  })

  const createStaff = useMutation({
    mutationFn: (dto: Parameters<typeof staffService.create>[0]) => staffService.create(dto),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff', tenantId] }); toast.success('Staff berhasil ditambahkan') },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateStaff = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Parameters<typeof staffService.update>[1] }) =>
      staffService.update(id, dto),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff', tenantId] }); toast.success('Staff berhasil diperbarui') },
    onError: (err: Error) => toast.error(err.message),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      staffService.toggleActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', tenantId] }),
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteStaff = useMutation({
    mutationFn: (id: string) => staffService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff', tenantId] }); toast.success('Staff berhasil dihapus') },
    onError: (err: Error) => toast.error(err.message),
  })

  const [openForm, setOpenForm] = useState(false)
  const [editTarget, setEditTarget] = useState<TenantUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TenantUser | null>(null)

  const form = useForm<StaffFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(staffSchema) as any,
    defaultValues: { name: '', role: 'cashier', pin: '' },
  })

  function openCreate() {
    setEditTarget(null)
    form.reset({ name: '', role: 'cashier', pin: '' })
    setOpenForm(true)
  }

  function openEdit(s: TenantUser) {
    setEditTarget(s)
    form.reset({ name: s.name, role: s.role as StaffFormValues['role'], pin: '' })
    setOpenForm(true)
  }

  async function onSubmit(values: StaffFormValues) {
    const dto = {
      name: values.name,
      role: values.role,
      pin: values.pin || null,
      is_active: true,
    }
    if (editTarget) {
      await updateStaff.mutateAsync({ id: editTarget.id, dto })
    } else {
      await createStaff.mutateAsync({
        ...dto,
        tenant_id: tenantId,
        user_id: null,
        branch_id: null,
        permissions: null,
      })
    }
    setOpenForm(false)
  }

  const columns: ColumnDef<TenantUser>[] = [
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
            {!row.original.is_active && (
              <p className="text-xs text-muted-foreground">Nonaktif</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant={row.original.role === 'owner' ? 'default' : 'secondary'}>
          {ROLE_LABELS[row.original.role] ?? row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'outline'}>
          {row.original.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const s = row.original
        if (s.role === 'owner') return null
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(s)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toggleActive.mutate({ id: s.id, isActive: !s.is_active })}
              >
                {s.is_active
                  ? <><ToggleLeft className="mr-2 h-3.5 w-3.5" />Nonaktifkan</>
                  : <><ToggleRight className="mr-2 h-3.5 w-3.5" />Aktifkan</>
                }
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteTarget(s)}
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
        title="Staff"
        description={`${staff?.length ?? 0} anggota tim`}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />Tambah Staff
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : (staff ?? []).length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada staff"
          description="Tambahkan kasir atau manajer untuk tim kamu."
          action={<Button size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Tambah Staff</Button>}
        />
      ) : (
        <DataTable columns={columns} data={staff ?? []} searchKey="name" searchPlaceholder="Cari nama staff..." />
      )}

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Staff' : 'Tambah Staff'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit as Parameters<typeof form.handleSubmit>[0])}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Nama <span className="text-destructive">*</span></Label>
              <Input placeholder="Nama lengkap" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                defaultValue={form.getValues('role')}
                onValueChange={(v) => form.setValue('role', v as StaffFormValues['role'])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS)
                    .filter(([v]) => v !== 'owner')
                    .map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>PIN Kasir (6 digit)</Label>
              <Input
                type="password"
                placeholder="••••••"
                maxLength={6}
                {...form.register('pin')}
              />
              {form.formState.errors.pin && (
                <p className="text-xs text-destructive">{form.formState.errors.pin.message}</p>
              )}
              <p className="text-xs text-muted-foreground">PIN digunakan untuk login kasir. Opsional.</p>
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
            <AlertDialogTitle>Hapus staff ini?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> akan dihapus dari tim kamu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) deleteStaff.mutate(deleteTarget.id); setDeleteTarget(null) }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
