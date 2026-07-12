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
import { useBranches } from '@/hooks/use-branches'
import type { TenantUser } from '@/types/app.types'

export const Route = createFileRoute('/app/staff')({
  component: StaffPage,
})

const staffSchema = z.object({
  name: z.string().min(1, 'Nama staff wajib diisi').max(100),
  role: z.enum(['owner', 'manager', 'cashier', 'warehouse']),
  branchId: z.string().min(1, 'Cabang wajib dipilih').optional(),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  pin: z.string().length(6, 'PIN harus 6 digit').regex(/^\d+$/, 'PIN harus angka').optional().or(z.literal('')),
}).refine((data) => {
  // Owner tidak perlu branch_id, role lain wajib
  if (data.role !== 'owner' && !data.branchId) return false
  return true
}, {
  message: 'Cabang wajib dipilih untuk role selain Owner',
  path: ['branchId'],
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
  const { tenantId, tenantUser, branchId, isOwner } = useTenant()
  const { data: branches } = useBranches()
  const queryClient = useQueryClient()

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', tenantId],
    queryFn: () => staffService.getAll(tenantId),
    staleTime: 5 * 60 * 1000,
  })

  const createStaff = useMutation({
    mutationFn: ({ 
      dto, 
      email, 
      password 
    }: { 
      dto: Parameters<typeof staffService.createWithAuth>[0]; 
      email: string; 
      password: string 
    }) => staffService.createWithAuth(dto, email, password),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff', tenantId] }); toast.success('Staff berhasil ditambahkan') },
    onError: (err: Error) => toast.error(err.message || 'Gagal menambahkan staff'),
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff', tenantId] }); toast.success('Staff berhasil dinonaktifkan') },
    onError: (err: Error) => toast.error(err.message),
  })

  const [openForm, setOpenForm] = useState(false)
  const [editTarget, setEditTarget] = useState<TenantUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TenantUser | null>(null)

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(editTarget ? staffEditSchema : staffSchema) as any,
    defaultValues: { name: '', role: '' as any, branchId: '', email: '', password: '', pin: '' },
  })

  function openCreate() {
    setEditTarget(null)
    // Manager otomatis assign staff ke cabang mereka sendiri
    const defaultBranchId = isOwner ? '' : (branchId || '')
    form.reset({ name: '', role: '' as any, branchId: defaultBranchId, email: '', password: '', pin: '' })
    setOpenForm(true)
  }

  function openEdit(s: TenantUser) {
    setEditTarget(s)
    form.reset({ name: s.name, role: s.role as StaffFormValues['role'], email: '', password: '', pin: '' })
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
        dto: { 
          ...dto, 
          tenant_id: tenantId, 
          user_id: null, 
          branch_id: values.branchId || null, 
          permissions: null 
        },
        email: values.email,
        password: values.password,
      })
    }
    setOpenForm(false)
  }

  const columns: ColumnDef<TenantUser>[] = [
    {
      accessorKey: 'name',
      header: 'Nama',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{row.original.name}</span>
          {row.original.user_id && (
            <span className="text-xs text-muted-foreground">Terhubung dengan Auth</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <Badge variant="outline">{ROLE_LABELS[row.original.role]}</Badge>,
    },
    {
      accessorKey: 'branch_id',
      header: 'Cabang',
      cell: ({ row }) => {
        if (row.original.role === 'owner') {
          return <Badge variant="secondary">Semua Cabang</Badge>
        }
        const branch = branches?.find((b) => b.id === row.original.branch_id)
        return (
          <span className="text-sm text-muted-foreground">
            {branch?.name ?? '—'}
          </span>
        )
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) =>
        row.original.is_active ? (
          <Badge variant="default" className="bg-green-500">Aktif</Badge>
        ) : (
          <Badge variant="secondary">Nonaktif</Badge>
        ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const s = row.original
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
              {s.id === tenantUser.id ? (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Tidak bisa hapus akun sendiri
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteTarget(s)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />Hapus
                </DropdownMenuItem>
              )}
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
                value={form.watch('role')}
                onValueChange={(v) => form.setValue('role', v as StaffFormValues['role'])}
              >
                <SelectTrigger><SelectValue placeholder="Pilih role" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS)
                    .filter(([v]) => v !== 'owner')
                    .map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                </SelectContent>              </Select>
            </div>
            {!editTarget && form.watch('role') !== 'owner' && (
              <div className="space-y-1.5">
                <Label>Cabang <span className="text-destructive">*</span></Label>
                <Select
                  value={form.watch('branchId')}
                  onValueChange={(v) => form.setValue('branchId', v)}
                >
                  <SelectTrigger disabled={!isOwner}><SelectValue placeholder="Pilih cabang" /></SelectTrigger>
                  <SelectContent>
                    {branches?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} {b.is_main && '(Utama)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.branchId && (
                  <p className="text-xs text-destructive">{form.formState.errors.branchId.message}</p>
                )}
                {!isOwner && branchId && (
                  <p className="text-xs text-muted-foreground">
                    Staff akan ditambahkan ke cabang Anda
                  </p>
                )}
              </div>
            )}
            {!editTarget && (
              <>
                <div className="space-y-1.5">
                  <Label>Email <span className="text-destructive">*</span></Label>
                  <Input type="email" placeholder="staff@example.com" {...form.register('email')} />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Password <span className="text-destructive">*</span></Label>
                  <Input type="password" placeholder="Min 8 karakter" {...form.register('password')} />
                  {form.formState.errors.password && (
                    <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Staff akan login dengan email dan password ini.</p>
                </div>
              </>
            )}
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
            <AlertDialogTitle>Nonaktifkan staff ini?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> akan dinonaktifkan dan tidak bisa login lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) deleteStaff.mutate(deleteTarget.id); setDeleteTarget(null) }}
            >
              Nonaktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
