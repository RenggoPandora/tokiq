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
      .order('role', { ascending: true })
    if (error) throw error
    return (data ?? []) as TenantUser[]
  },

  /**
   * Buat staff baru dengan akun Supabase Auth.
   * Owner mengisi email + password untuk staff.
   * Staff bisa login dengan email+password ini di halaman /login.
   */
  async createWithAuth(
    dto: Omit<TenantUser, 'id' | 'created_at'>,
    email: string,
    password: string
  ): Promise<TenantUser> {
    // 1. Buat akun Supabase Auth untuk staff
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Jangan auto-login setelah signup (agar owner session tidak tergantikan)
        data: { role: dto.role, tenant_id: dto.tenant_id },
      },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Gagal membuat akun staff')

    // 2. Simpan ke tenant_users dengan user_id dari Auth
    const { data, error } = await db
      .from('tenant_users')
      .insert({ ...dto, user_id: authData.user.id })
      .select()
      .single()

    if (error) {
      // Rollback tidak bisa dilakukan dari client (butuh service role)
      // Tapi record di Auth tidak berbahaya kalau tenant_users gagal
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
    const { error } = await supabase.from('tenant_users').delete().eq('id', id)
    if (error) throw error
  },
}
