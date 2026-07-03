/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type { Tenant, TodaySummary } from '@/types/app.types'

const db = supabase as any

// ===========================
// ONBOARDING
// ===========================

export interface OnboardingData {
  businessName: string
  businessType: string
  phone?: string
  logoUrl?: string
}

export const tenantOnboardingService = {
  /**
   * Step 1: Buat tenant record + branch utama setelah user register & verifikasi email.
   * Dipanggil sekali saat tenant pertama kali login.
   */
  async setupTenant(
    userId: string,
    data: OnboardingData
  ): Promise<Tenant> {
    const now = new Date()
    const trialEnd = new Date(now)
    trialEnd.setDate(trialEnd.getDate() + 14)

    // Cek apakah tenant sudah ada
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('owner_user_id', userId)
      .maybeSingle()

    if (existing) {
      // Sudah punya tenant, return existing
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', (existing as { id: string }).id)
        .single()
      if (error) throw error
      return tenant as unknown as Tenant
    }

    // Buat email dari user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    const email = userData.user?.email ?? ''

    // Buat tenant
    const { data: tenant, error: tenantError } = await db
      .from('tenants')
      .insert({
        owner_user_id: userId,
        business_name: data.businessName,
        business_type: data.businessType,
        email,
        phone: data.phone ?? null,
        logo_url: data.logoUrl ?? null,
        status: 'trial',
        trial_ends_at: trialEnd.toISOString(),
      })
      .select()
      .single()
    if (tenantError) throw tenantError

    const tenantId = (tenant as Tenant).id

    // Buat branch utama
    const { error: branchError } = await db
      .from('branches')
      .insert({
        tenant_id: tenantId,
        name: data.businessName,
        is_main: true,
      })
    if (branchError) throw branchError

    // Buat tenant_user untuk owner
    const { error: tuError } = await db
      .from('tenant_users')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        role: 'owner',
        name: data.businessName,
        is_active: true,
      })
    if (tuError) throw tuError

    return tenant as unknown as Tenant
  },

  async updateTenantProfile(tenantId: string, data: Partial<OnboardingData>): Promise<void> {
    const { error } = await db
      .from('tenants')
      .update({
        business_name: data.businessName,
        business_type: data.businessType,
        phone: data.phone ?? null,
        logo_url: data.logoUrl ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)
    if (error) throw error
  },
}

// ===========================
// DASHBOARD
// ===========================

export const tenantDashboardService = {
  async getTodaySummary(tenantId: string): Promise<TodaySummary> {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('transactions')
      .select('total_amount, subtotal, discount_amount')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString())

    if (error) throw error

    const transactions = (data ?? []) as {
      total_amount: number
      subtotal: number
      discount_amount: number
    }[]

    const totalRevenue = transactions.reduce((s, t) => s + t.total_amount, 0)
    const totalTransactions = transactions.length
    const avgTransactionValue = totalTransactions > 0
      ? Math.round(totalRevenue / totalTransactions)
      : 0

    return {
      totalRevenue,
      totalTransactions,
      totalProfit: 0, // diisi nanti saat ada cost_price di transaction_items
      avgTransactionValue,
    }
  },

  async getSalesLast7Days(
    tenantId: string
  ): Promise<{ date: string; total: number; count: number }[]> {
    const results: { date: string; total: number; count: number }[] = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const start = d.toISOString()
      const end = new Date(d)
      end.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('transactions')
        .select('total_amount')
        .eq('tenant_id', tenantId)
        .eq('status', 'completed')
        .gte('created_at', start)
        .lte('created_at', end.toISOString())

      if (error) throw error

      const rows = (data ?? []) as { total_amount: number }[]
      const total = rows.reduce((s, r) => s + r.total_amount, 0)
      const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
      results.push({ date: label, total, count: rows.length })
    }

    return results
  },

  async getLowStockCount(tenantId: string): Promise<number> {
    const { count, error } = await supabase
      .from('stocks')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .filter('quantity', 'lte', 'min_stock')

    if (error) throw error
    return count ?? 0
  },

  async getActiveProductCount(tenantId: string): Promise<number> {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    if (error) throw error
    return count ?? 0
  },
}
