import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Building2, Loader2, MoreHorizontal, MapPin, Phone, Star } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
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
import { useTenant } from '@/hooks/use-tenant'
import type { Branch } from '@/types/app.types'

export const Route = createFileRoute('/app/branches')({
  component: BranchesPage,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const branchSchema = z.object({
  name: z.string().min(1, 'Nama cabang wajib diisi').max(100),
  address: z.string().optional(),
  phone: z.string().optional(),
})
type BranchFormValues = z.infer<typeof branchSchema>

function BranchesPage() {
  const { tenantId } = useTenant()
  const queryClient = useQueryClient()

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('is_main', { ascending: false })
      if (error) throw error
      return (data ?? []) as Branch[]
    },
    staleTime: 10 * 60 * 1000,
  })

  const createBranch = useMutation({
    mutationFn: async (dto: BranchFormValues) => {
      const { data, error } = await db
        .from('branches')
        .insert({ ...dto, tenant_id: tenantId, is_main: false })
        .select()
        .single()
      if (error) throw error
      return data as Branch
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] })
      toast.success('Cabang berhasil ditambahkan')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateBranch = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: BranchFormValues }) => {
      const { data, error } = await db.from('branches').update(dto).eq('id', id).select().single()
      if (error) throw error
      return data as Branch
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] })
      toast.success('Cabang berhasil diperbarui')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteBranch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('branches').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] })
      toast.success('Cabang berhasil dihapus')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const [openForm, setOpenForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Branch | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null)

  const form = useForm<BranchFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(branchSchema) as any,
    defaultValues: { name: '', address: '', phone: '' },
  })

  function openCreate() {
    setEditTarget(null)
    form.reset({ name: '', address: '', phone: '' })
    setOpenForm(true)
  }

  function openEdit(b: Branch) {
    setEditTarget(b)
    form.reset({ name: b.name, address: b.address ?? '', phone: b.phone ?? '' })
    setOpenForm(true)
  }

  async function onSubmit(values: BranchFormValues) {
    if (editTarget) {
      await updateBranch.mutateAsync({ id: editTarget.id, dto: values })
    } else {
      await createBranch.mutateAsync(values)
    }
    setOpenForm(false)
  }

  const columns: ColumnDef<Branch>[] = [
    {
      accessorKey: 'name',
      header: 'Nama Cabang',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-sm">{row.original.name}</p>
              {row.original.is_main && (
                <Badge variant="secondary" className="text-[10px] gap-0.5 py-0">
                  <Star className="w-2.5 h-2.5" />Utama
                </Badge>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Kontak',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          {row.original.address && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-xs">{row.original.address}</span>
            </div>
          )}
          {row.original.phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="w-3 h-3 shrink-0" />
              {row.original.phone}
            </div>
          )}
          {!row.original.address && !row.original.phone && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const b = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(b)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />Edit
              </DropdownMenuItem>
              {!b.is_main && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteTarget(b)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />Hapus
                  </DropdownMenuItem>
                </>
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
        title="Cabang"
        description={`${branches?.length ?? 0} cabang terdaftar`}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />Tambah Cabang
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : (branches ?? []).length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Belum ada cabang"
          description="Tambahkan cabang untuk mengelola beberapa lokasi bisnis."
          action={<Button size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Tambah Cabang</Button>}
        />
      ) : (
        <DataTable columns={columns} data={branches ?? []} searchKey="name" searchPlaceholder="Cari cabang..." />
      )}

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Cabang' : 'Tambah Cabang'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit as Parameters<typeof form.handleSubmit>[0])}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Nama Cabang <span className="text-destructive">*</span></Label>
              <Input placeholder="contoh: Cabang Selatan" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Alamat</Label>
              <Input placeholder="Jl. ..." {...form.register('address')} />
            </div>
            <div className="space-y-1.5">
              <Label>No. Telepon</Label>
              <Input type="tel" placeholder="08xxx" {...form.register('phone')} />
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
            <AlertDialogTitle>Hapus cabang ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Cabang <strong>{deleteTarget?.name}</strong> akan dihapus permanen. Data stok dan transaksi di cabang ini tidak terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) deleteBranch.mutate(deleteTarget.id); setDeleteTarget(null) }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
