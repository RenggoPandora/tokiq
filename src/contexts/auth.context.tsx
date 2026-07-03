import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { AuthUser, Tenant, TenantUser } from '@/types/app.types'

// Super Admin email — ini dikontrol di level aplikasi (bukan DB role)
// Idealnya diset via env var
const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL as string | undefined

interface AuthContextValue {
  session: Session | null
  user: User | null
  authUser: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Muat profil tenant user setelah session ada
  async function loadAuthUser(sessionUser: User): Promise<AuthUser> {
    const isSuperAdmin =
      SUPER_ADMIN_EMAIL
        ? sessionUser.email === SUPER_ADMIN_EMAIL
        : sessionUser.user_metadata?.role === 'super_admin'

    if (isSuperAdmin) {
      return {
        id: sessionUser.id,
        email: sessionUser.email ?? '',
        tenantId: null,
        tenantUser: null,
        tenant: null,
        isSuperAdmin: true,
      }
    }

    // Cari tenant_user berdasarkan user_id
    const { data: tenantUserData, error: tuError } = await supabase
      .from('tenant_users')
      .select('*')
      .eq('user_id', sessionUser.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (tuError) {
      console.error('[auth] Gagal memuat tenant user:', tuError.message)
    }

    const tenantUser = tenantUserData as TenantUser | null

    // Kalau ada tenant user, load tenant-nya
    let tenant: Tenant | null = null
    if (tenantUser?.tenant_id) {
      const { data: tenantData, error: tError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantUser.tenant_id)
        .maybeSingle()

      if (tError) {
        console.error('[auth] Gagal memuat tenant:', tError.message)
      } else {
        tenant = tenantData as Tenant | null
      }
    }

    return {
      id: sessionUser.id,
      email: sessionUser.email ?? '',
      tenantId: tenantUser?.tenant_id ?? null,
      tenantUser,
      tenant,
      isSuperAdmin: false,
    }
  }

  useEffect(() => {
    // Ambil session awal
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession)
      const u = initialSession?.user ?? null
      setUser(u)
      if (u) {
        const au = await loadAuthUser(u)
        setAuthUser(au)
      }
      setIsLoading(false)
    })

    // Subscribe ke perubahan auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      const u = newSession?.user ?? null
      setUser(u)
      if (u && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        const au = await loadAuthUser(u)
        setAuthUser(au)
      } else if (event === 'SIGNED_OUT') {
        setAuthUser(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string, metadata?: Record<string, unknown>) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        authUser,
        isLoading,
        isAuthenticated: !!session,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider')
  }
  return ctx
}
