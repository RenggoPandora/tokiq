/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type { Stock, StockMovement, Supplier, Product } from '@/types/app.types'

const db = supabase as any

// ===========================
// STOCK
// ===========================

export interface StockWithProduct extends Stock {
  products: Pick<Product, 'name' | 'sku' | 'image_url'> | null
}

export const stockService = {
  async getAll(tenantId: string, branchId?: string): Promise<StockWithProduct[]> {
    let query = supabase
      .from('stocks')
      .select('*, products(name, sku, image_url)')
      .eq('tenant_id', tenantId)
      .order('quantity', { ascending: true })

    if (branchId) query = query.eq('branch_id', branchId)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as StockWithProduct[]
  },

  async getLowStock(tenantId: string): Promise<StockWithProduct[]> {
    const { data, error } = await supabase
      .from('stocks')
      .select('*, products(name, sku, image_url)')
      .eq('tenant_id', tenantId)
      .filter('quantity', 'lte', 'min_stock')
      .order('quantity', { ascending: true })

    if (error) throw error
    return (data ?? []) as unknown as StockWithProduct[]
  },

  async adjust(
    tenantId: string,
    productId: string,
    branchId: string,
    newQty: number,
    reason: string,
    userId: string
  ): Promise<void> {
    // Get current stock
    const { data: current, error: fetchErr } = await supabase
      .from('stocks')
      .select('quantity')
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .eq('branch_id', branchId)
      .maybeSingle()

    if (fetchErr) throw fetchErr

    const currentQty = (current as { quantity: number } | null)?.quantity ?? 0
    const diff = newQty - currentQty

    if (diff === 0) return

    // Upsert stock
    const { error: upsertErr } = await db
      .from('stocks')
      .upsert({
        tenant_id: tenantId,
        product_id: productId,
        branch_id: branchId,
        quantity: newQty,
        updated_at: new Date().toISOString(),
      })
    if (upsertErr) throw upsertErr

    // Log movement
    const { error: movErr } = await db
      .from('stock_movements')
      .insert({
        tenant_id: tenantId,
        product_id: productId,
        branch_id: branchId,
        type: 'adjustment',
        quantity: diff,
        notes: reason,
        created_by: userId,
      })
    if (movErr) throw movErr
  },

  async getMovements(tenantId: string, productId?: string): Promise<StockMovement[]> {
    let query = supabase
      .from('stock_movements')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (productId) query = query.eq('product_id', productId)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as StockMovement[]
  },
}

// ===========================
// SUPPLIER
// ===========================

export const supplierService = {
  async getAll(tenantId: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })
    if (error) throw error
    return (data ?? []) as Supplier[]
  },

  async create(dto: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> {
    const { data, error } = await db
      .from('suppliers')
      .insert(dto)
      .select()
      .single()
    if (error) throw error
    return data as Supplier
  },

  async update(id: string, dto: Partial<Omit<Supplier, 'id' | 'created_at' | 'tenant_id'>>): Promise<Supplier> {
    const { data, error } = await db
      .from('suppliers')
      .update(dto)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Supplier
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
