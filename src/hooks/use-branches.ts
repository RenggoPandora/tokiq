import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/hooks/use-tenant'
import type { Branch } from '@/types/app.types'

export const branchKeys = {
  all: ['branches'] as const,
  list: (tenantId: string) => [...branchKeys.all, tenantId] as const,
}

export function useBranches() {
  const { tenantId } = useTenant()
  return useQuery({
    queryKey: branchKeys.list(tenantId),
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
}
