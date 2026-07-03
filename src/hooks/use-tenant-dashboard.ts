import { useQuery } from '@tanstack/react-query'
import { tenantDashboardService } from '@/services/tenant.service'
import { useTenant } from '@/hooks/use-tenant'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  today: (tenantId: string) => [...dashboardKeys.all, 'today', tenantId] as const,
  sales7: (tenantId: string) => [...dashboardKeys.all, 'sales7', tenantId] as const,
  lowStock: (tenantId: string) => [...dashboardKeys.all, 'lowStock', tenantId] as const,
  productCount: (tenantId: string) => [...dashboardKeys.all, 'productCount', tenantId] as const,
}

export function useTodaySummary() {
  const { tenantId } = useTenant()
  return useQuery({
    queryKey: dashboardKeys.today(tenantId),
    queryFn: () => tenantDashboardService.getTodaySummary(tenantId),
    staleTime: 30 * 1000, // refresh tiap 30 detik
    refetchInterval: 60 * 1000,
  })
}

export function useSalesLast7Days() {
  const { tenantId } = useTenant()
  return useQuery({
    queryKey: dashboardKeys.sales7(tenantId),
    queryFn: () => tenantDashboardService.getSalesLast7Days(tenantId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useLowStockCount() {
  const { tenantId } = useTenant()
  return useQuery({
    queryKey: dashboardKeys.lowStock(tenantId),
    queryFn: () => tenantDashboardService.getLowStockCount(tenantId),
    staleTime: 2 * 60 * 1000,
  })
}

export function useActiveProductCount() {
  const { tenantId } = useTenant()
  return useQuery({
    queryKey: dashboardKeys.productCount(tenantId),
    queryFn: () => tenantDashboardService.getActiveProductCount(tenantId),
    staleTime: 5 * 60 * 1000,
  })
}
