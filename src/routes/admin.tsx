import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AdminSidebar } from '@/components/layouts/admin-sidebar'

// Layout route untuk semua halaman admin (/admin/*)
export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
