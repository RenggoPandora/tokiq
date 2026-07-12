/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type { TenantUser } from '@/types/app.types'

const db = supabase as any

export const staffService = {
  async getAll(tenantId: string): Promise<TenantUser[]> {
    const { data, error } = await supabase
      .from('tenant_users')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('role', { ascending: true })
    if (error) throw error
    return (data ?? []) as TenantUser[]
  },

  /**
   * Buat staff baru dengan akun Supabase Auth.
   * CATATAN: signUp dari client akan SELALU ganti session.
   * Kita harus immediately restore session owner.
   */
  async createWithAuth(
    dto: Omit<TenantUser, 'id' | 'created_at'>,
    email: string,
    password: string
  ): Promise<TenantUser> {
    // 1. Simpan session owner SEBELUM signUp
    const { data: { session: ownerSession } } = await supabase.auth.getSession()
    
    if (!ownerSession) {
      throw new Error('Owner session tidak ditemukan')
    }

    // 2. Buat akun staff (ini akan ganti session)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          role: dto.role, 
          tenant_id: dto.tenant_id,
        },
      },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Gagal membuat akun staff')

    // 3. SEGERA restore session owner (sebelum React re-render)
    const { error: restoreError } = await supabase.auth.setSession({
      access_token: ownerSession.access_token,
      refresh_token: ownerSession.refresh_token,
    })

    if (restoreError) {
      console.error('Gagal restore session:', restoreError)
      throw new Error('Gagal restore session owner')
    }

    // 4. Simpan ke tenant_users
    const { data, error } = await db
      .from('tenant_users')
      .insert({ ...dto, user_id: authData.user.id })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as TenantUser
  },

  async create(dto: Omit<TenantUser, 'id' | 'created_at'>): Promise<TenantUser> {
    const { data, error } = await db
      .from('tenant_users')
      .insert(dto)
      .select()
      .single()
    if (error) throw error
    return data as TenantUser
  },

  async update(
    id: string,
    dto: Partial<Omit<TenantUser, 'id' | 'created_at' | 'tenant_id' | 'user_id'>>
  ): Promise<TenantUser> {
    const { data, error } = await db
      .from('tenant_users')
      .update(dto)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as TenantUser
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await db
      .from('tenant_users')
      .update({ is_active: isActive })
      .eq('id', id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    // Soft delete: set is_active = false instead of actually deleting
    // Karena Auth user tidak bisa dihapus dari client (butuh service role)
    const { error } = await supabase
      .from('tenant_users')
      .update({ is_active: false })
      .eq('id', id)
    if (error) throw error
  },
}
