import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { stockService, supplierService } from '@/services/stock.service'
import { useTenant } from '@/hooks/use-tenant'
import type { Supplier } from '@/types/app.types'

export const stockKeys = {
  all: ['stocks'] as const,
  list: (tenantId: string, branchId?: string | null) => [...stockKeys.all, tenantId, branchId] as const,
  low: (tenantId: string) => [...stockKeys.all, 'low', tenantId] as const,
  movements: (tenantId: string, productId?: string) =>
    [...stockKeys.all, 'movements', tenantId, productId] as const,
}

export const supplierKeys = {
  all: ['suppliers'] as const,
  list: (tenantId: string) => [...supplierKeys.all, tenantId] as const,
}

// ===========================
// STOCK
// ===========================

export function useStock() {
  const { tenantId, branchId } = useTenant()
  return useQuery({
    queryKey: stockKeys.list(tenantId, branchId),
    queryFn: () => stockService.getAll(tenantId, branchId ?? undefined),
    staleTime: 2 * 60 * 1000,
  })
}

export function useLowStock() {
  const { tenantId } = useTenant()
  return useQuery({
    queryKey: stockKeys.low(tenantId),
    queryFn: () => stockService.getLowStock(tenantId),
    staleTime: 2 * 60 * 1000,
  })
}

export function useStockMovements(productId?: string) {
  const { tenantId } = useTenant()
  return useQuery({
    queryKey: stockKeys.movements(tenantId, productId),
    queryFn: () => stockService.getMovements(tenantId, productId),
    staleTime: 1 * 60 * 1000,
  })
}

export function useAdjustStock() {
  const queryClient = useQueryClient()
  const { tenantId, tenantUser, branchId } = useTenant()
  return useMutation({
    mutationFn: ({
      productId, branchId: targetBranchId, newQty, reason,
    }: {
      productId: string
      branchId: string
      newQty: number
      reason: string
    }) => stockService.adjust(tenantId, productId, targetBranchId, newQty, reason, tenantUser.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.list(tenantId, branchId) })
      queryClient.invalidateQueries({ queryKey: stockKeys.low(tenantId) })
      toast.success('Stok berhasil diperbarui')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

// ===========================
// SUPPLIER
// ===========================

export function useSuppliers() {
  const { tenantId } = useTenant()
  return useQuery({
    queryKey: supplierKeys.list(tenantId),
    queryFn: () => supplierService.getAll(tenantId),
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  return useMutation({
    mutationFn: (dto: Omit<Supplier, 'id' | 'created_at' | 'tenant_id'>) =>
      supplierService.create({ ...dto, tenant_id: tenantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.list(tenantId) })
      toast.success('Supplier berhasil ditambahkan')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Omit<Supplier, 'id' | 'created_at' | 'tenant_id'>> }) =>
      supplierService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.list(tenantId) })
      toast.success('Supplier berhasil diperbarui')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  return useMutation({
    mutationFn: (id: string) => supplierService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.list(tenantId) })
      toast.success('Supplier berhasil dihapus')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}
