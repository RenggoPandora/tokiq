/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type {
  Category, Product, ProductWithCategory,
  CreateCategory, CreateProduct, UpdateProduct, UpdateCategory,
} from '@/types/app.types'

const db = supabase as any

// ===========================
// CATEGORIES
// ===========================

export const categoriesService = {
  async getAll(tenantId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return (data ?? []) as Category[]
  },

  async create(dto: CreateCategory): Promise<Category> {
    const { data, error } = await db
      .from('categories')
      .insert(dto)
      .select()
      .single()
    if (error) throw error
    return data as Category
  },

  async update(id: string, dto: UpdateCategory): Promise<Category> {
    const { data, error } = await db
      .from('categories')
      .update(dto)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Category
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}

// ===========================
// PRODUCTS
// ===========================

export interface ProductFilters {
  search?: string
  categoryId?: string
  isActive?: boolean
}

export const productsService = {
  async getAll(tenantId: string, filters?: ProductFilters): Promise<ProductWithCategory[]> {
    let query = supabase
      .from('products')
      .select('*, categories(name, color, icon)')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }
    if (filters?.search) {
      query = query.or(
        
`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as ProductWithCategory[]
  },

  async getById(id: string): Promise<ProductWithCategory> {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, color, icon)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as unknown as ProductWithCategory
  },

  async create(dto: CreateProduct): Promise<Product> {
    const { data, error } = await db
      .from('products')
      .insert(dto)
      .select()
      .single()
    if (error) throw error

    // Fallback: Buat stock record jika trigger belum jalan
    // (Trigger database seharusnya handle ini otomatis)
    try {
      const { data: branches } = await supabase
        .from('branches')
        .select('id')
        .eq('tenant_id', dto.tenant_id)

      if (branches && branches.length > 0) {
        const stockRecords = branches.map((b) => ({
          tenant_id: dto.tenant_id,
          product_id: data.id,
          branch_id: b.id,
          quantity: 0,
          min_stock: 5,
        }))

        await db.from('stocks').insert(stockRecords)
      }
    } catch (stockErr) {
      // Jangan fail create product kalau stock insert gagal
      console.warn('Failed to create initial stock records:', stockErr)
    }

    return data as Product
  },

  async update(id: string, dto: UpdateProduct): Promise<Product> {
    const { data, error } = await db
      .from('products')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Product
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await db
      .from('products')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
