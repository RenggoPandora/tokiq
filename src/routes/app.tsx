import { createFileRoute, Outlet } from '@tanstack/react-router'
import { TenantSidebar } from '@/components/layouts/tenant-sidebar'

// Layout route untuk semua halaman tenant (/app/*)
export const Route = createFileRoute('/app')({
  component: TenantLayout,
})

function TenantLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <TenantSidebar />
      <main className="flex-1 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
