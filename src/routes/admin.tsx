import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { AdminSidebar } from '@/components/layouts/admin-sidebar'
import { useAuth } from '@/contexts/auth.context'

// Layout route untuk semua halaman admin (/admin/*)
export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  const { authUser, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading) return

    if (!authUser) {
      navigate({ to: '/login' })
      return
    }

    // Hanya super admin yang boleh akses /admin/*
    if (!authUser.isSuperAdmin) {
      navigate({ to: '/app/dashboard' })
    }
  }, [authUser, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!authUser || !authUser.isSuperAdmin) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
