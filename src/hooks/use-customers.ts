import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { customersService } from '@/services/customers.service'
import { useTenant } from '@/hooks/use-tenant'
import type { Customer } from '@/types/app.types'

const customerKeys = {
  all: ['customers'] as const,
  list: (tenantId: string) => [...customerKeys.all, tenantId] as const,
  history: (customerId: string) => [...customerKeys.all, 'history', customerId] as const,
}

export function useCustomers() {
  const { tenantId } = useTenant()
  return useQuery({
    queryKey: customerKeys.list(tenantId),
    queryFn: () => customersService.getAll(tenantId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCustomerHistory(customerId: string) {
  return useQuery({
    queryKey: customerKeys.history(customerId),
    queryFn: () => customersService.getTransactionHistory(customerId),
    enabled: !!customerId,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  return useMutation({
    mutationFn: (dto: Omit<Customer, 'id' | 'created_at' | 'points' | 'tenant_id'>) =>
      customersService.create({ ...dto, tenant_id: tenantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.list(tenantId) })
      toast.success('Pelanggan berhasil ditambahkan')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string
      dto: Partial<Omit<Customer, 'id' | 'created_at' | 'tenant_id'>>
    }) => customersService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.list(tenantId) })
      toast.success('Pelanggan berhasil diperbarui')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  return useMutation({
    mutationFn: (id: string) => customersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.list(tenantId) })
      toast.success('Pelanggan berhasil dihapus')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}
