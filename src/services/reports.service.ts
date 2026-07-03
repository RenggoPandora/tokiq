/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'

export interface SalesReportRow {
  date: string
  total_revenue: number
  transaction_count: number
  total_discount: number
}

export interface TopProduct {
  product_id: string
  product_name: string
  quantity_sold: number
  revenue: number
}

export interface SalesReport {
  daily: SalesReportRow[]
  totalRevenue: number
  totalTransactions: number
  totalDiscount: number
  avgOrderValue: number
}

export const reportsService = {
  async getSalesReport(
    tenantId: string,
    startDate: string,
    endDate: string
  ): Promise<SalesReport> {
    const { data, error } = await supabase
      .from('transactions')
      .select('created_at, total_amount, discount_amount, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true })

    if (error) throw error

    type TxRow = { created_at: string; total_amount: number; discount_amount: number }
    const rows = (data ?? []) as TxRow[]

    // Group by date
    const byDate = new Map<string, { total: number; count: number; discount: number }>()
    for (const row of rows) {
      const date = row.created_at.slice(0, 10)
      const existing = byDate.get(date) ?? { total: 0, count: 0, discount: 0 }
      byDate.set(date, {
        total: existing.total + row.total_amount,
        count: existing.count + 1,
        discount: existing.discount + row.discount_amount,
      })
    }

    const daily: SalesReportRow[] = Array.from(byDate.entries()).map(([date, v]) => ({
      date,
      total_revenue: v.total,
      transaction_count: v.count,
      total_discount: v.discount,
    }))

    const totalRevenue = rows.reduce((s, r) => s + r.total_amount, 0)
    const totalTransactions = rows.length
    const totalDiscount = rows.reduce((s, r) => s + r.discount_amount, 0)

    return {
      daily,
      totalRevenue,
      totalTransactions,
      totalDiscount,
      avgOrderValue: totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0,
    }
  },

  async getTopProducts(
    tenantId: string,
    startDate: string,
    endDate: string,
    limit = 10
  ): Promise<TopProduct[]> {
    const { data, error } = await supabase
      .from('transaction_items')
      .select('product_id, product_name, quantity, subtotal')
      .eq('tenant_id', tenantId)
      .gte('created_at' as any, startDate)
      .lte('created_at' as any, endDate)

    if (error) throw error

    type ItemRow = { product_id: string; product_name: string; quantity: number; subtotal: number }
    const rows = (data ?? []) as ItemRow[]

    // Aggregate by product
    const map = new Map<string, TopProduct>()
    for (const row of rows) {
      const existing = map.get(row.product_id) ?? {
        product_id: row.product_id,
        product_name: row.product_name,
        quantity_sold: 0,
        revenue: 0,
      }
      map.set(row.product_id, {
        ...existing,
        quantity_sold: existing.quantity_sold + row.quantity,
        revenue: existing.revenue + row.subtotal,
      })
    }

    return Array.from(map.values())
      .sort((a, b) => b.quantity_sold - a.quantity_sold)
      .slice(0, limit)
  },
}
