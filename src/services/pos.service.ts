/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type { Shift, Transaction, Branch } from '@/types/app.types'
import type { CartItem } from '@/types/app.types'
import { generateReceiptNumber } from '@/lib/utils'

const db = supabase as any

// ===========================
// BRANCH
// ===========================

export const branchService = {
  async getMainBranch(tenantId: string): Promise<Branch | null> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_main', true)
      .maybeSingle()
    if (error) throw error
    return data as Branch | null
  },
}

// ===========================
// SHIFT
// ===========================

export const shiftService = {
  async openShift(
    tenantId: string,
    branchId: string,
    cashierId: string,
    openingCash: number
  ): Promise<Shift> {
    const { data, error } = await db
      .from('shifts')
      .insert({
        tenant_id: tenantId,
        branch_id: branchId,
        cashier_id: cashierId,
        opening_cash: openingCash,
        status: 'open',
        opened_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw error
    return data as Shift
  },

  async closeShift(
    shiftId: string,
    closingCash: number,
    notes?: string
  ): Promise<Shift> {
    const { data, error } = await db
      .from('shifts')
      .update({
        status: 'closed',
        closing_cash: closingCash,
        closed_at: new Date().toISOString(),
        notes: notes ?? null,
      })
      .eq('id', shiftId)
      .select()
      .single()
    if (error) throw error
    return data as Shift
  },

  async getActiveShift(tenantId: string, cashierId: string): Promise<Shift | null> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('cashier_id', cashierId)
      .eq('status', 'open')
      .maybeSingle()
    if (error) throw error
    return data as Shift | null
  },

  async getShiftSummary(shiftId: string): Promise<{
    totalSales: number
    transactionCount: number
    cashSales: number
    qrisSales: number
    transferSales: number
  }> {
    const { data, error } = await supabase
      .from('transactions')
      .select('total_amount, payment_method')
      .eq('shift_id', shiftId)
      .eq('status', 'completed')
    if (error) throw error

    const rows = (data ?? []) as { total_amount: number; payment_method: string }[]
    return {
      totalSales: rows.reduce((s, r) => s + r.total_amount, 0),
      transactionCount: rows.length,
      cashSales: rows.filter((r) => r.payment_method === 'cash').reduce((s, r) => s + r.total_amount, 0),
      qrisSales: rows.filter((r) => r.payment_method === 'qris').reduce((s, r) => s + r.total_amount, 0),
      transferSales: rows.filter((r) => r.payment_method === 'transfer').reduce((s, r) => s + r.total_amount, 0),
    }
  },
}

// ===========================
// TRANSACTION
// ===========================

export interface CreateTransactionInput {
  tenantId: string
  branchId: string
  shiftId: string | null
  cashierId: string
  customerId: string | null
  items: CartItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  paymentMethod: 'cash' | 'qris' | 'transfer'
  paidAmount: number
  notes?: string
}

export const transactionService = {
  async create(input: CreateTransactionInput): Promise<Transaction> {
    const receiptNumber = generateReceiptNumber()

    // Buat transaction header
    const { data: txn, error: txnError } = await db
      .from('transactions')
      .insert({
        tenant_id: input.tenantId,
        branch_id: input.branchId,
        shift_id: input.shiftId,
        cashier_id: input.cashierId,
        customer_id: input.customerId,
        receipt_number: receiptNumber,
        subtotal: input.subtotal,
        discount_amount: input.discountAmount,
        tax_amount: input.taxAmount,
        total_amount: input.total,
        payment_method: input.paymentMethod,
        paid_amount: input.paidAmount,
        change_amount: Math.max(0, input.paidAmount - input.total),
        status: 'completed',
        notes: input.notes ?? null,
        is_synced: true,
      })
      .select()
      .single()
    if (txnError) throw txnError

    const transactionId = (txn as Transaction).id

    // Buat transaction items
    const itemsDto = input.items.map((item) => ({
      transaction_id: transactionId,
      tenant_id: input.tenantId,
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      discount_amount: 0,
      subtotal: item.price * item.quantity,
      addons: item.addons.length > 0 ? item.addons : null,
    }))

    const { error: itemsError } = await db.from('transaction_items').insert(itemsDto)
    if (itemsError) throw itemsError

    // Update stok per item — best effort (tidak throw jika gagal)
    for (const item of input.items) {
      try {
        await db.rpc('decrement_stock', {
          p_tenant_id: input.tenantId,
          p_branch_id: input.branchId,
          p_product_id: item.productId,
          p_variant_id: item.variantId ?? null,
          p_quantity: item.quantity,
        })
      } catch {
        // Stock update gagal — log ke console, transaksi tetap valid
        console.warn(`[pos] Stock update failed for product ${item.productId}`)
      }
    }

    return txn as Transaction
  },

  async getRecent(tenantId: string, limit = 20): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []) as Transaction[]
  },
}
