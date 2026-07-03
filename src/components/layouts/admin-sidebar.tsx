import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard, Users, CreditCard, Receipt, BarChart3,
  ShoppingCart, LogOut, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth.context'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/admin/', icon: LayoutDashboard },
  { label: 'Tenant', to: '/admin/tenants', icon: Users },
  { label: 'Paket & Pricing', to: '/admin/plans', icon: CreditCard },
  { label: 'Pembayaran', to: '/admin/invoices', icon: Receipt },
  { label: 'Laporan', to: '/admin/reports', icon: BarChart3 },
  { label: 'Pengaturan', to: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const { signOut } = useAuth()
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

  return (
    <aside className="w-60 flex-shrink-0 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
          <ShoppingCart className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm tracking-tight">tokiq</span>
        <span className="ml-auto text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.to === '/admin'
              ? currentPath === '/admin'
              : currentPath.startsWith(item.to)

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
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-border">
        <Separator className="mb-3" />
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
