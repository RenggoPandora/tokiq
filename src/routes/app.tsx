import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { TenantSidebar } from '@/components/layouts/tenant-sidebar'
import { useAuth } from '@/contexts/auth.context'

// Layout route untuk semua halaman tenant (/app/*)
export const Route = createFileRoute('/app')({
  component: TenantLayout,
})

function TenantLayout() {
  const { authUser, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading) return

    // Belum login → ke login
    if (!authUser) {
      navigate({ to: '/login' })
      return
    }

    // Super admin tidak boleh akses /app/*
    if (authUser.isSuperAdmin) {
      navigate({ to: '/admin' })
      return
    }

    // Login tapi belum punya tenant → ke onboarding
    if (!authUser.tenantId) {
      navigate({ to: '/onboarding' })
    }
  }, [authUser, isLoading, navigate])

  // Tampilkan loading saat cek auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Jangan render layout kalau kondisi belum terpenuhi
  if (!authUser || authUser.isSuperAdmin || !authUser.tenantId) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <TenantSidebar />
      <main className="flex-1 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
