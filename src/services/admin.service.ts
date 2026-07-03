/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type {
  Tenant,
  Invoice,
  SubscriptionPlan,
  TenantWithPlan,
  PlatformStats,
} from '@/types/app.types'

// Cast client to any to bypass strict Supabase Update<T> = never inference
// that occurs when partial update objects don't satisfy the exact column set.
const db = supabase as any

// ===========================
// TENANT
// ===========================

export interface TenantFilters {
  search?: string
  status?: string
  planId?: string
}

export const adminTenantsService = {
  async getAll(filters?: TenantFilters): Promise<TenantWithPlan[]> {
    let query = supabase
      .from('tenants')
      .select('*, subscription_plans(name, price_monthly)')
      .order('created_at', { ascending: false })

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.planId) query = query.eq('plan_id', filters.planId)
    if (filters?.search) {
      query = query.or(
        `business_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as TenantWithPlan[]
  },

  async getById(id: string): Promise<TenantWithPlan> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*, subscription_plans(name, price_monthly)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as unknown as TenantWithPlan
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await db
      .from('tenants')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async extendTrial(id: string, days: number): Promise<void> {
    const { data: tenantData, error: fetchError } = await supabase
      .from('tenants')
      .select('trial_ends_at')
      .eq('id', id)
      .single()
    if (fetchError) throw fetchError

    const tenant = tenantData as Pick<Tenant, 'trial_ends_at'>
    const currentEnd = tenant.trial_ends_at
      ? new Date(tenant.trial_ends_at)
      : new Date()
    currentEnd.setDate(currentEnd.getDate() + days)

    const { error } = await db
      .from('tenants')
      .update({
        trial_ends_at: currentEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) throw error
  },
}

// ===========================
// PLANS
// ===========================

export type CreatePlanDto = Omit<SubscriptionPlan, 'id' | 'created_at'>
export type UpdatePlanDto = Partial<CreatePlanDto>

export const adminPlansService = {
  async getAll(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true })
    if (error) throw error
    return (data ?? []) as SubscriptionPlan[]
  },

  async create(dto: CreatePlanDto): Promise<SubscriptionPlan> {
    const { data, error } = await db
      .from('subscription_plans')
      .insert(dto)
      .select()
      .single()
    if (error) throw error
    return data as SubscriptionPlan
  },

  async update(id: string, dto: UpdatePlanDto): Promise<SubscriptionPlan> {
    const { data, error } = await db
      .from('subscription_plans')
      .update(dto)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as SubscriptionPlan
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await db
      .from('subscription_plans')
      .update({ is_active: isActive })
      .eq('id', id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('subscription_plans')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}

// ===========================
// INVOICES
// ===========================

export interface InvoiceWithTenant extends Invoice {
  tenants: Pick<Tenant, 'business_name' | 'email'> | null
  subscription_plans: Pick<SubscriptionPlan, 'name'> | null
}

export const adminInvoicesService = {
  async getAll(status?: string): Promise<InvoiceWithTenant[]> {
    let query = supabase
      .from('invoices')
      .select('*, tenants(business_name, email), subscription_plans(name)')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as InvoiceWithTenant[]
  },

  async confirmPayment(invoiceId: string, confirmedByUserId: string): Promise<void> {
    const now = new Date().toISOString()

    const { error: invoiceError } = await db
      .from('invoices')
      .update({ status: 'paid', paid_at: now, confirmed_by: confirmedByUserId })
      .eq('id', invoiceId)
    if (invoiceError) throw invoiceError

    const { data: invoiceData, error: fetchError } = await supabase
      .from('invoices')
      .select('tenant_id, period_end')
      .eq('id', invoiceId)
      .single()
    if (fetchError) throw fetchError

    const invoice = invoiceData as Pick<Invoice, 'tenant_id' | 'period_end'>

    const { error: tenantError } = await db
      .from('tenants')
      .update({
        status: 'active',
        subscription_ends_at: invoice.period_end,
        updated_at: now,
      })
      .eq('id', invoice.tenant_id)
    if (tenantError) throw tenantError
  },

  async rejectPayment(invoiceId: string): Promise<void> {
    const { error } = await db
      .from('invoices')
      .update({ status: 'cancelled' })
      .eq('id', invoiceId)
    if (error) throw error
  },
}

// ===========================
// PLATFORM STATS
// ===========================

type TenantStatsRow = {
  id: string
  status: string
  created_at: string
  plan_id: string | null
  subscription_plans: { price_monthly: number } | null
}

export const adminStatsService = {
  async getPlatformStats(): Promise<PlatformStats> {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data: rawTenants, error } = await supabase
      .from('tenants')
      .select('id, status, created_at, plan_id, subscription_plans(price_monthly)')

    if (error) throw error

    const tenants = (rawTenants ?? []) as unknown as TenantStatsRow[]

    const activeSubscribers = tenants.filter((t) => t.status === 'active').length
    const trialUsers = tenants.filter((t) => t.status === 'trial').length

    const mrr = tenants
      .filter((t) => t.status === 'active')
      .reduce((sum, t) => sum + (t.subscription_plans?.price_monthly ?? 0), 0)

    const churnedThisMonth = tenants.filter(
      (t) => t.status === 'expired' && t.created_at >= firstDayOfMonth
    ).length

    const newThisMonth = tenants.filter(
      (t) => t.created_at >= firstDayOfMonth
    ).length

    return { mrr, activeSubscribers, trialUsers, churnedThisMonth, newThisMonth }
  },

  async getMrrByMonth(months = 6): Promise<{ month: string; mrr: number }[]> {
    const results: { month: string; mrr: number }[] = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = d.toISOString()
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString()

      const { data, error } = await supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_at', start)
        .lte('paid_at', end)

      if (error) throw error

      const total = (data ?? []).reduce((sum, inv) => {
        return sum + ((inv as { amount: number }).amount ?? 0)
      }, 0)

      const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
      results.push({ month: label, mrr: total })
    }

    return results
  },
}
