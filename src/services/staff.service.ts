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
