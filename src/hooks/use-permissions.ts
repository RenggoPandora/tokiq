import { useAuth } from '@/contexts/auth.context'
import { TENANT_ROLES } from '@/lib/constants'

// Daftar permission keys yang tersedia
export type PermissionKey =
  | 'pos.access'
  | 'products.view'
  | 'products.manage'
  | 'categories.manage'
  | 'stock.view'
  | 'stock.manage'
  | 'customers.view'
  | 'customers.manage'
  | 'suppliers.manage'
  | 'reports.view'
  | 'reports.export'
  | 'staff.manage'
  | 'branches.manage'
  | 'settings.manage'
  | 'billing.view'

// Default permission matrix per role
const ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  [TENANT_ROLES.OWNER]: [
    'pos.access',
    'products.view',
    'products.manage',
    'categories.manage',
    'stock.view',
    'stock.manage',
    'customers.view',
    'customers.manage',
    'suppliers.manage',
    'reports.view',
    'reports.export',
    'staff.manage',
    'branches.manage',
    'settings.manage',
    'billing.view',
  ],
  [TENANT_ROLES.MANAGER]: [
    'pos.access',
    'products.view',
    'products.manage',
    'categories.manage',
    'stock.view',
    'stock.manage',
    'customers.view',
    'customers.manage',
    'suppliers.manage',
    'reports.view',
    'reports.export',
    'staff.manage',
  ],
  [TENANT_ROLES.CASHIER]: [
    'pos.access',
    'products.view',
    'stock.view',
    'customers.view',
  ],
  [TENANT_ROLES.WAREHOUSE]: [
    'products.view',
    'stock.view',
    'stock.manage',
    'suppliers.manage',
  ],
}

interface UsePermissionsReturn {
  hasPermission: (key: PermissionKey) => boolean
  hasAnyPermission: (keys: PermissionKey[]) => boolean
  hasAllPermissions: (keys: PermissionKey[]) => boolean
  isSuperAdmin: boolean
}

/**
 * Hook untuk mengecek permission user.
 * Super Admin selalu punya semua permission.
 * Tenant user mengikuti role defaults + custom permissions dari DB.
 */
export function usePermissions(): UsePermissionsReturn {
  const { authUser } = useAuth()

  const isSuperAdmin = authUser?.isSuperAdmin ?? false

  function hasPermission(key: PermissionKey): boolean {
    if (isSuperAdmin) return true
    if (!authUser?.tenantUser) return false

    const role = authUser.tenantUser.role
    const customPermissions = authUser.tenantUser.permissions as Record<string, boolean> | null

    // Cek custom permission override dari DB
    if (customPermissions && key in customPermissions) {
      return customPermissions[key] === true
    }

    // Fallback ke role default
    return ROLE_PERMISSIONS[role]?.includes(key) ?? false
  }

  function hasAnyPermission(keys: PermissionKey[]): boolean {
    return keys.some(hasPermission)
  }

  function hasAllPermissions(keys: PermissionKey[]): boolean {
    return keys.every(hasPermission)
  }

  return { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin }
}
