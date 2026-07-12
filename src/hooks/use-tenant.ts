import { useAuth } from '@/contexts/auth.context'
import type { Tenant, TenantUser } from '@/types/app.types'

interface UseTenantReturn {
  tenantId: string
  tenant: Tenant
  tenantUser: TenantUser
  branchId: string | null
  role: string
  isOwner: boolean
  isManager: boolean
  isCashier: boolean
  isWarehouse: boolean
}

/**
 * Hook untuk mengakses data tenant dari context auth.
 * Harus digunakan HANYA di dalam route yang sudah dilindungi (tenant routes).
 * Jika digunakan di luar konteks tenant yang valid, akan throw error.
 */
export function useTenant(): UseTenantReturn {
  const { authUser } = useAuth()

  if (!authUser?.tenantId || !authUser.tenant || !authUser.tenantUser) {
    throw new Error(
      'useTenant harus digunakan di dalam route tenant yang sudah terautentikasi. ' +
      'Pastikan pengguna sudah login dan memiliki akun tenant.'
    )
  }

  const role = authUser.tenantUser.role
  const branchId = authUser.tenantUser.branch_id

  return {
    tenantId: authUser.tenantId,
    tenant: authUser.tenant,
    tenantUser: authUser.tenantUser,
    branchId, // null untuk owner, specific branch untuk staff
    role,
    isOwner: role === 'owner',
    isManager: role === 'manager' || role === 'owner',
    isCashier: role === 'cashier',
    isWarehouse: role === 'warehouse',
  }
}
