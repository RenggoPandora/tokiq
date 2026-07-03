// ===========================
// APPLICATION TYPES
// ===========================
// Custom app types yang tidak langsung dari database
// Types database ada di database.types.ts

import type { Database } from './database.types'

// Shortcut row types dari database
export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row']
export type Tenant = Database['public']['Tables']['tenants']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type Branch = Database['public']['Tables']['branches']['Row']
export type TenantUser = Database['public']['Tables']['tenant_users']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ProductVariant = Database['public']['Tables']['product_variants']['Row']
export type ProductAddon = Database['public']['Tables']['product_addons']['Row']
export type Stock = Database['public']['Tables']['stocks']['Row']
export type StockMovement = Database['public']['Tables']['stock_movements']['Row']
export type Supplier = Database['public']['Tables']['suppliers']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Shift = Database['public']['Tables']['shifts']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionItem = Database['public']['Tables']['transaction_items']['Row']
export type Discount = Database['public']['Tables']['discounts']['Row']
export type ProductPrice = Database['public']['Tables']['product_prices']['Row']
export type Purchase = Database['public']['Tables']['purchases']['Row']
export type PurchaseItem = Database['public']['Tables']['purchase_items']['Row']
export type CashMovement = Database['public']['Tables']['cash_movements']['Row']

// Insert types (untuk create)
export type CreateProduct = Database['public']['Tables']['products']['Insert']
export type CreateCategory = Database['public']['Tables']['categories']['Insert']
export type CreateTransaction = Database['public']['Tables']['transactions']['Insert']
export type CreateTransactionItem = Database['public']['Tables']['transaction_items']['Insert']
export type CreateStock = Database['public']['Tables']['stocks']['Insert']
export type CreateCustomer = Database['public']['Tables']['customers']['Insert']
export type CreateSupplier = Database['public']['Tables']['suppliers']['Insert']
export type CreateTenantUser = Database['public']['Tables']['tenant_users']['Insert']

// Update types
export type UpdateProduct = Database['public']['Tables']['products']['Update']
export type UpdateCategory = Database['public']['Tables']['categories']['Update']
export type UpdateTenant = Database['public']['Tables']['tenants']['Update']

// ===========================
// Extended types (join results)
// ===========================

export interface ProductWithCategory extends Product {
  categories: Pick<Category, 'name' | 'color' | 'icon'> | null
}

export interface ProductWithStock extends Product {
  stocks: Stock[]
  categories: Pick<Category, 'name' | 'color'> | null
}

export interface TransactionWithItems extends Transaction {
  transaction_items: TransactionItem[]
  customers: Pick<Customer, 'name' | 'phone'> | null
  tenant_users: Pick<TenantUser, 'name'> | null
}

export interface TenantWithPlan extends Tenant {
  subscription_plans: Pick<SubscriptionPlan, 'name' | 'price_monthly'> | null
}

// ===========================
// Cart types (Zustand store)
// ===========================

export interface CartAddon {
  id: string
  name: string
  price: number
}

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  variantId?: string
  variantName?: string
  addons: CartAddon[]
  notes?: string
}

// ===========================
// Auth context types
// ===========================

export interface AuthUser {
  id: string
  email: string
  tenantId: string | null
  tenantUser: TenantUser | null
  tenant: Tenant | null
  isSuperAdmin: boolean
}

// ===========================
// Filter types
// ===========================

export interface ProductFilters {
  categoryId?: string
  search?: string
  isActive?: boolean
}

export interface TransactionFilters {
  startDate?: string
  endDate?: string
  paymentMethod?: string
  cashierId?: string
  status?: string
}

export interface StockFilters {
  branchId?: string
  categoryId?: string
  lowStock?: boolean
  search?: string
}

// ===========================
// Dashboard stats types
// ===========================

export interface TodaySummary {
  totalRevenue: number
  totalTransactions: number
  totalProfit: number
  avgTransactionValue: number
}

export interface PlatformStats {
  mrr: number
  activeSubscribers: number
  trialUsers: number
  churnedThisMonth: number
  newThisMonth: number
}

// ===========================
// API response types
// ===========================

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}
