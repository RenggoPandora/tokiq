import { useQuery } from '@tanstack/react-query'
import { reportsService } from '@/services/reports.service'
import { useTenant } from '@/hooks/use-tenant'

const reportKeys = {
  sales: (tenantId: string, start: string, end: string) =>
    ['reports', 'sales', tenantId, start, end] as const,
  topProducts: (tenantId: string, start: string, end: string) =>
    ['reports', 'top-products', tenantId, start, end] as const,
}

export function useSalesReport(startDate: string, endDate: string) {
  const { tenantId } = useTenant()
  return useQuery({
    queryKey: reportKeys.sales(tenantId, startDate, endDate),
    queryFn: () => reportsService.getSalesReport(tenantId, startDate, endDate),
    staleTime: 5 * 60 * 1000,
    enabled: !!startDate && !!endDate,
  })
}

export function useTopProducts(startDate: string, endDate: string) {
  const { tenantId } = useTenant()
  return useQuery({
    queryKey: reportKeys.topProducts(tenantId, startDate, endDate),
    queryFn: () => reportsService.getTopProducts(tenantId, startDate, endDate),
    staleTime: 5 * 60 * 1000,
    enabled: !!startDate && !!endDate,
  })
}
