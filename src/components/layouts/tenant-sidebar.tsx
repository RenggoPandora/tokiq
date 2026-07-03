import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3, Users,
  Truck, UserCircle, Building2, Settings, LogOut, CreditCard,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth.context'
import { usePermissions } from '@/hooks/use-permissions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { APP_CONFIG } from '@/lib/constants'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  permission?: Parameters<ReturnType<typeof usePermissions>['hasPermission']>[0]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Kasir (POS)', to: '/app/pos', icon: ShoppingCart, permission: 'pos.access' },
  { label: 'Produk', to: '/app/products', icon: Package, permission: 'products.view' },
  { label: 'Kategori', to: '/app/categories', icon: Layers, permission: 'products.view' },
  { label: 'Stok', to: '/app/stock', icon: Package, permission: 'stock.view' },
  { label: 'Pelanggan', to: '/app/customers', icon: UserCircle, permission: 'customers.view' },
  { label: 'Supplier', to: '/app/suppliers', icon: Truck, permission: 'suppliers.manage' },
  { label: 'Laporan', to: '/app/reports', icon: BarChart3, permission: 'reports.view' },
]

const SECONDARY_NAV: NavItem[] = [
  { label: 'Staff', to: '/app/staff', icon: Users, permission: 'staff.manage' },
  { label: 'Cabang', to: '/app/branches', icon: Building2, permission: 'branches.manage' },
  { label: 'Langganan', to: '/app/billing', icon: CreditCard, permission: 'billing.view' },
  { label: 'Pengaturan', to: '/app/settings', icon: Settings, permission: 'settings.manage' },
]

export function TenantSidebar() {
  const { signOut, authUser } = useAuth()
  const { hasPermission } = usePermissions()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Berhasil keluar')
    } catch {
      toast.error('Gagal keluar')
    }
  }

  const businessName = authUser?.tenant?.business_name ?? APP_CONFIG.NAME

  function renderNavItem(item: NavItem) {
    if (item.permission && !hasPermission(item.permission)) return null

    const isActive = currentPath.startsWith(item.to)

    return (
      <Link
        key={item.to}
        to={item.to}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        {item.label}
      </Link>
    )
  }

  return (
    <aside className="w-60 flex-shrink-0 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      {/* Logo + bisnis name */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
          <ShoppingCart className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm tracking-tight truncate">{businessName}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(renderNavItem)}

        <Separator className="my-2" />

        {SECONDARY_NAV.map(renderNavItem)}
      </nav>

      {/* User info + sign out */}
      <div className="px-2 py-3 border-t border-border">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium text-foreground truncate">
            {authUser?.tenantUser?.name ?? authUser?.email}
          </p>
          <p className="text-[11px] text-muted-foreground capitalize">
            {authUser?.tenantUser?.role ?? 'User'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Keluar
        </Button>
      </div>
    </aside>
  )
}
