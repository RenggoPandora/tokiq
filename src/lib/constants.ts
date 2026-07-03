// ===========================
// TOKIQ CONSTANTS
// ===========================

// Jenis bisnis (untuk onboarding)
export const BUSINESS_TYPES = [
  { value: 'fnb', label: 'Kuliner / FnB' },
  { value: 'retail', label: 'Retail / Minimarket' },
  { value: 'fashion', label: 'Fashion / Butik' },
  { value: 'service', label: 'Jasa (Salon, Laundry, Bengkel)' },
  { value: 'electronics', label: 'Elektronik / Counter HP' },
  { value: 'other', label: 'Lainnya' },
] as const

export type BusinessType = (typeof BUSINESS_TYPES)[number]['value']

// Metode pembayaran
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tunai' },
  { value: 'qris', label: 'QRIS' },
  { value: 'transfer', label: 'Transfer Bank' },
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value']

// Role tenant user
export const TENANT_ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  WAREHOUSE: 'warehouse',
} as const

export type TenantRole = (typeof TENANT_ROLES)[keyof typeof TENANT_ROLES]

// Status tenant
export const TENANT_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired',
} as const

export type TenantStatus = (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS]

// Status invoice
export const INVOICE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS]

// Stock movement types
export const STOCK_MOVEMENT_TYPES = {
  SALE: 'sale',
  PURCHASE: 'purchase',
  ADJUSTMENT: 'adjustment',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
  RETURN: 'return',
} as const

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[keyof typeof STOCK_MOVEMENT_TYPES]

// Kelompok pelanggan
export const CUSTOMER_GROUPS = {
  REGULAR: 'regular',
  MEMBER: 'member',
  VIP: 'vip',
} as const

export type CustomerGroup = (typeof CUSTOMER_GROUPS)[keyof typeof CUSTOMER_GROUPS]

// Tipe harga produk
export const PRICE_TYPES = [
  { value: 'regular', label: 'Harga Normal' },
  { value: 'wholesale', label: 'Harga Grosir' },
  { value: 'member', label: 'Harga Member' },
] as const

export type PriceType = (typeof PRICE_TYPES)[number]['value']

// Status shift
export const SHIFT_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
} as const

export type ShiftStatus = (typeof SHIFT_STATUS)[keyof typeof SHIFT_STATUS]

// Status transaksi
export const TRANSACTION_STATUS = {
  COMPLETED: 'completed',
  VOIDED: 'voided',
  PENDING: 'pending',
} as const

export type TransactionStatus = (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS]

// Status purchase order
export const PURCHASE_STATUS = {
  PENDING: 'pending',
  RECEIVED: 'received',
  PARTIAL: 'partial',
} as const

export type PurchaseStatus = (typeof PURCHASE_STATUS)[keyof typeof PURCHASE_STATUS]

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

// App config
export const APP_CONFIG = {
  NAME: 'tokiq',
  TAGLINE: 'POS untuk UMKM Indonesia',
  TRIAL_DAYS: 14,
  MAX_CART_ITEMS: 100,
  DEFAULT_TAX_RATE: 0, // 0% default (bisa di-setting per tenant)
  MIN_STOCK_ALERT: 5, // default threshold alert stok menipis
  RECEIPT_PREFIX: 'TRX',
} as const
