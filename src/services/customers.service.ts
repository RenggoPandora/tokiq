/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type { Customer, Transaction } from '@/types/app.types'

const db = supabase as any

export interface CustomerWithStats extends Customer {
  transaction_count?: number
  total_spent?: number
}

export const customersService = {
  async getAll(tenantId: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })
    if (error) throw error
    return (data ?? []) as Customer[]
  },

  async create(dto: Omit<Customer, 'id' | 'created_at' | 'points'>): Promise<Customer> {
    const { data, error } = await db
      .from('customers')
      .insert({ ...dto, points: 0 })
      .select()
      .single()
    if (error) throw error
    return data as Customer
  },

  async update(
    id: string,
    dto: Partial<Omit<Customer, 'id' | 'created_at' | 'tenant_id'>>
  ): Promise<Customer> {
    const { data, error } = await db
      .from('customers')
      .update(dto)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Customer
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) throw error
  },

  async getTransactionHistory(customerId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return (data ?? []) as Transaction[]
  },
}
