import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { shiftService, transactionService, type CreateTransactionInput } from '@/services/pos.service'
import { useTenant } from '@/hooks/use-tenant'

export const shiftKeys = {
  active: (tenantId: string, cashierId: string) => ['shift', 'active', tenantId, cashierId] as const,
  summary: (shiftId: string) => ['shift', 'summary', shiftId] as const,
}

export function useActiveShift() {
  const { tenantId, tenantUser } = useTenant()
  return useQuery({
    queryKey: shiftKeys.active(tenantId, tenantUser.id),
    queryFn: () => shiftService.getActiveShift(tenantId, tenantUser.id),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}

export function useShiftSummary(shiftId: string | null) {
  return useQuery({
    queryKey: shiftKeys.summary(shiftId ?? ''),
    queryFn: () => shiftService.getShiftSummary(shiftId!),
    enabled: !!shiftId,
  })
}

export function useOpenShift() {
  const queryClient = useQueryClient()
  const { tenantId, tenantUser } = useTenant()
  return useMutation({
    mutationFn: ({ branchId, openingCash }: { branchId: string; openingCash: number }) =>
      shiftService.openShift(tenantId, branchId, tenantUser.id, openingCash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift'] })
      toast.success('Shift berhasil dibuka')
    },
    onError: (err: Error) => toast.error(`Gagal buka shift: ${err.message}`),
  })
}

export function useCloseShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ shiftId, closingCash, notes }: { shiftId: string; closingCash: number; notes?: string }) =>
      shiftService.closeShift(shiftId, closingCash, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift'] })
      toast.success('Shift berhasil ditutup')
    },
    onError: (err: Error) => toast.error(`Gagal tutup shift: ${err.message}`),
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => transactionService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err: Error) => toast.error(`Transaksi gagal: ${err.message}`),
  })
}
