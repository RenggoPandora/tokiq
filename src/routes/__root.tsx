import { createRootRouteWithContext, Outlet, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/auth.context'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { supabase } from '@/lib/supabase'

interface RouterContext {
  queryClient: QueryClient
}

// Route yang tidak memerlukan autentikasi
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/onboarding']

export const Route = createRootRouteWithContext<RouterContext>()({
  // beforeLoad dijalankan sebelum setiap navigasi
  beforeLoad: async ({ location }) => {
    const pathname = location.pathname

    // Cek apakah route memerlukan autentikasi
    const isPublic = PUBLIC_ROUTES.some((r) =>
      r === '/' ? pathname === '/' : pathname.startsWith(r)
    )

    // Ambil session
    const { data: { session } } = await supabase.auth.getSession()

    // Kalau belum login dan akses protected route, redirect ke login
    if (!session && !isPublic) {
      throw redirect({ to: '/login' })
    }

    // Kalau sudah login dan akses auth pages, redirect ke app
    if (session && (pathname === '/login' || pathname === '/register')) {
      throw redirect({ to: '/app/dashboard' })
    }
  },
  component: RootLayout,
})

function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Outlet />
        {import.meta.env.DEV && (
          <>
            <TanStackRouterDevtools position="bottom-right" />
            <ReactQueryDevtools initialIsOpen={false} />
          </>
        )}
      </AuthProvider>
    </ErrorBoundary>
  )
}
