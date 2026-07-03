import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  adminTenantsService,
  adminPlansService,
  adminInvoicesService,
  adminStatsService,
  type TenantFilters,
  type CreatePlanDto,
  type UpdatePlanDto,
} from '@/services/admin.service'
import { useAuth } from '@/contexts/auth.context'

// ===========================
// QUERY KEYS
// ===========================

export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  mrr: (months: number) => [...adminKeys.all, 'mrr', months] as const,
  tenants: () => [...adminKeys.all, 'tenants'] as const,
  tenantList: (filters?: TenantFilters) => [...adminKeys.tenants(), filters] as const,
  tenantDetail: (id: string) => [...adminKeys.tenants(), id] as const,
  plans: () => [...adminKeys.all, 'plans'] as const,
  invoices: () => [...adminKeys.all, 'invoices'] as const,
  invoiceList: (status?: string) => [...adminKeys.invoices(), status] as const,
}

// ===========================
// STATS
// ===========================

export function usePlatformStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: adminStatsService.getPlatformStats,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMrrChart(months = 6) {
  return useQuery({
    queryKey: adminKeys.mrr(months),
    queryFn: () => adminStatsService.getMrrByMonth(months),
    staleTime: 10 * 60 * 1000,
  })
}

// ===========================
// TENANTS
// ===========================

export function useAdminTenants(filters?: TenantFilters) {
  return useQuery({
    queryKey: adminKeys.tenantList(filters),
    queryFn: () => adminTenantsService.getAll(filters),
    staleTime: 2 * 60 * 1000,
  })
}

export function useAdminTenantDetail(id: string) {
  return useQuery({
    queryKey: adminKeys.tenantDetail(id),
    queryFn: () => adminTenantsService.getById(id),
    enabled: !!id,
  })
}

export function useUpdateTenantStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminTenantsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.tenants() })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() })
      toast.success('Status tenant berhasil diperbarui')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

export function useExtendTrial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      adminTenantsService.extendTrial(id, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.tenants() })
      toast.success('Trial berhasil diperpanjang')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

// ===========================
// PLANS
// ===========================

export function useAdminPlans() {
  return useQuery({
    queryKey: adminKeys.plans(),
    queryFn: adminPlansService.getAll,
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreatePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePlanDto) => adminPlansService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.plans() })
      toast.success('Paket berhasil ditambahkan')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePlanDto }) =>
      adminPlansService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.plans() })
      toast.success('Paket berhasil diperbarui')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

export function useTogglePlanActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminPlansService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.plans() })
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

export function useDeletePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminPlansService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.plans() })
      toast.success('Paket berhasil dihapus')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

// ===========================
// INVOICES
// ===========================

export function useAdminInvoices(status?: string) {
  return useQuery({
    queryKey: adminKeys.invoiceList(status),
    queryFn: () => adminInvoicesService.getAll(status),
    staleTime: 1 * 60 * 1000,
  })
}

export function useConfirmPayment() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (invoiceId: string) =>
      adminInvoicesService.confirmPayment(invoiceId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.invoices() })
      queryClient.invalidateQueries({ queryKey: adminKeys.tenants() })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() })
      toast.success('Pembayaran berhasil dikonfirmasi')
    },
    onError: (err: Error) => toast.error(`Gagal konfirmasi: ${err.message}`),
  })
}

export function useRejectPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invoiceId: string) => adminInvoicesService.rejectPayment(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.invoices() })
      toast.success('Pembayaran ditolak')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}
