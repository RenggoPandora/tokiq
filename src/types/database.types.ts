// ===========================
// DATABASE TYPES PLACEHOLDER
// ===========================
// File ini akan di-generate ulang oleh Supabase CLI setelah schema dibuat.
// Jalankan: npx supabase gen types typescript --local > src/types/database.types.ts
//
// Untuk sekarang, ini adalah placeholder yang memungkinkan TypeScript tidak error.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      subscription_plans: {
        Row: {
          id: string
          name: string
          price_monthly: number
          price_yearly: number | null
          trial_days: number
          is_active: boolean
          features: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          price_monthly: number
          price_yearly?: number | null
          trial_days?: number
          is_active?: boolean
          features?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          trial_days?: number
          is_active?: boolean
          features?: Json | null
          created_at?: string
        }
      }
      tenants: {
        Row: {
          id: string
          owner_user_id: string | null
          business_name: string
          business_type: string | null
          email: string
          phone: string | null
          logo_url: string | null
          plan_id: string | null
          status: string
          trial_ends_at: string | null
          subscription_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_user_id?: string | null
          business_name: string
          business_type?: string | null
          email: string
          phone?: string | null
          logo_url?: string | null
          plan_id?: string | null
          status?: string
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_user_id?: string | null
          business_name?: string
          business_type?: string | null
          email?: string
          phone?: string | null
          logo_url?: string | null
          plan_id?: string | null
          status?: string
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          tenant_id: string
          plan_id: string | null
          amount: number
          period_start: string | null
          period_end: string | null
          status: string
          payment_method: string | null
          payment_proof_url: string | null
          paid_at: string | null
          confirmed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          plan_id?: string | null
          amount: number
          period_start?: string | null
          period_end?: string | null
          status?: string
          payment_method?: string | null
          payment_proof_url?: string | null
          paid_at?: string | null
          confirmed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          plan_id?: string | null
          amount?: number
          period_start?: string | null
          period_end?: string | null
          status?: string
          payment_method?: string | null
          payment_proof_url?: string | null
          paid_at?: string | null
          confirmed_by?: string | null
          created_at?: string
        }
      }
      branches: {
        Row: {
          id: string
          tenant_id: string
          name: string
          address: string | null
          phone: string | null
          is_main: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          address?: string | null
          phone?: string | null
          is_main?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          address?: string | null
          phone?: string | null
          is_main?: boolean
          created_at?: string
        }
      }
      tenant_users: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          branch_id: string | null
          role: string
          name: string
          pin: string | null
          is_active: boolean
          permissions: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id?: string | null
          branch_id?: string | null
          role: string
          name: string
          pin?: string | null
          is_active?: boolean
          permissions?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string | null
          branch_id?: string | null
          role?: string
          name?: string
          pin?: string | null
          is_active?: boolean
          permissions?: Json | null
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          tenant_id: string
          name: string
          color: string | null
          icon: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          color?: string | null
          icon?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          color?: string | null
          icon?: string | null
          sort_order?: number
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          tenant_id: string
          category_id: string | null
          name: string
          sku: string | null
          barcode: string | null
          description: string | null
          image_url: string | null
          sell_price: number
          cost_price: number
          has_variants: boolean
          has_addons: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          category_id?: string | null
          name: string
          sku?: string | null
          barcode?: string | null
          description?: string | null
          image_url?: string | null
          sell_price: number
          cost_price?: number
          has_variants?: boolean
          has_addons?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          category_id?: string | null
          name?: string
          sku?: string | null
          barcode?: string | null
          description?: string | null
          image_url?: string | null
          sell_price?: number
          cost_price?: number
          has_variants?: boolean
          has_addons?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          tenant_id: string
          variant_name: string
          sku: string | null
          barcode: string | null
          additional_price: number
          is_active: boolean
        }
        Insert: {
          id?: string
          product_id: string
          tenant_id: string
          variant_name: string
          sku?: string | null
          barcode?: string | null
          additional_price?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          product_id?: string
          tenant_id?: string
          variant_name?: string
          sku?: string | null
          barcode?: string | null
          additional_price?: number
          is_active?: boolean
        }
      }
      product_addons: {
        Row: {
          id: string
          product_id: string
          tenant_id: string
          name: string
          price: number
          is_active: boolean
        }
        Insert: {
          id?: string
          product_id: string
          tenant_id: string
          name: string
          price?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          product_id?: string
          tenant_id?: string
          name?: string
          price?: number
          is_active?: boolean
        }
      }
      stocks: {
        Row: {
          id: string
          tenant_id: string
          product_id: string
          variant_id: string | null
          branch_id: string
          quantity: number
          min_stock: number
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          product_id: string
          variant_id?: string | null
          branch_id: string
          quantity?: number
          min_stock?: number
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          product_id?: string
          variant_id?: string | null
          branch_id?: string
          quantity?: number
          min_stock?: number
          updated_at?: string
        }
      }
      stock_movements: {
        Row: {
          id: string
          tenant_id: string
          product_id: string
          variant_id: string | null
          branch_id: string
          type: string
          quantity: number
          reference_id: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          product_id: string
          variant_id?: string | null
          branch_id: string
          type: string
          quantity: number
          reference_id?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          product_id?: string
          variant_id?: string | null
          branch_id?: string
          type?: string
          quantity?: number
          reference_id?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          tenant_id: string
          name: string
          phone: string | null
          email: string | null
          address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          tenant_id: string
          name: string
          phone: string | null
          email: string | null
          points: number
          customer_group: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          phone?: string | null
          email?: string | null
          points?: number
          customer_group?: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          points?: number
          customer_group?: string
          created_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          tenant_id: string
          branch_id: string
          cashier_id: string
          opening_cash: number
          closing_cash: number | null
          status: string
          opened_at: string
          closed_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          branch_id: string
          cashier_id: string
          opening_cash?: number
          closing_cash?: number | null
          status?: string
          opened_at?: string
          closed_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          branch_id?: string
          cashier_id?: string
          opening_cash?: number
          closing_cash?: number | null
          status?: string
          opened_at?: string
          closed_at?: string | null
          notes?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          tenant_id: string
          branch_id: string
          shift_id: string | null
          cashier_id: string
          customer_id: string | null
          receipt_number: string
          subtotal: number
          discount_amount: number
          tax_amount: number
          total_amount: number
          payment_method: string
          paid_amount: number | null
          change_amount: number
          status: string
          notes: string | null
          is_synced: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          branch_id: string
          shift_id?: string | null
          cashier_id: string
          customer_id?: string | null
          receipt_number: string
          subtotal: number
          discount_amount?: number
          tax_amount?: number
          total_amount: number
          payment_method: string
          paid_amount?: number | null
          change_amount?: number
          status?: string
          notes?: string | null
          is_synced?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          branch_id?: string
          shift_id?: string | null
          cashier_id?: string
          customer_id?: string | null
          receipt_number?: string
          subtotal?: number
          discount_amount?: number
          tax_amount?: number
          total_amount?: number
          payment_method?: string
          paid_amount?: number | null
          change_amount?: number
          status?: string
          notes?: string | null
          is_synced?: boolean
          created_at?: string
        }
      }
      transaction_items: {
        Row: {
          id: string
          transaction_id: string
          tenant_id: string
          product_id: string
          variant_id: string | null
          product_name: string
          quantity: number
          unit_price: number
          discount_amount: number
          subtotal: number
          addons: Json | null
        }
        Insert: {
          id?: string
          transaction_id: string
          tenant_id: string
          product_id: string
          variant_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
          discount_amount?: number
          subtotal: number
          addons?: Json | null
        }
        Update: {
          id?: string
          transaction_id?: string
          tenant_id?: string
          product_id?: string
          variant_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
          discount_amount?: number
          subtotal?: number
          addons?: Json | null
        }
      }
      discounts: {
        Row: {
          id: string
          tenant_id: string
          name: string
          type: string
          value: number
          min_purchase: number
          is_active: boolean
          starts_at: string | null
          ends_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          type: string
          value: number
          min_purchase?: number
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          type?: string
          value?: number
          min_purchase?: number
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
        }
      }
      product_prices: {
        Row: {
          id: string
          product_id: string
          tenant_id: string
          price_type: string
          price: number
        }
        Insert: {
          id?: string
          product_id: string
          tenant_id: string
          price_type: string
          price: number
        }
        Update: {
          id?: string
          product_id?: string
          tenant_id?: string
          price_type?: string
          price?: number
        }
      }
      purchases: {
        Row: {
          id: string
          tenant_id: string
          branch_id: string
          supplier_id: string | null
          invoice_number: string | null
          status: string
          total_amount: number
          notes: string | null
          received_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          branch_id: string
          supplier_id?: string | null
          invoice_number?: string | null
          status?: string
          total_amount?: number
          notes?: string | null
          received_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          branch_id?: string
          supplier_id?: string | null
          invoice_number?: string | null
          status?: string
          total_amount?: number
          notes?: string | null
          received_at?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      purchase_items: {
        Row: {
          id: string
          purchase_id: string
          tenant_id: string
          product_id: string
          variant_id: string | null
          quantity: number
          cost_price: number
          subtotal: number
        }
        Insert: {
          id?: string
          purchase_id: string
          tenant_id: string
          product_id: string
          variant_id?: string | null
          quantity: number
          cost_price: number
          subtotal: number
        }
        Update: {
          id?: string
          purchase_id?: string
          tenant_id?: string
          product_id?: string
          variant_id?: string | null
          quantity?: number
          cost_price?: number
          subtotal?: number
        }
      }
      cash_movements: {
        Row: {
          id: string
          tenant_id: string
          shift_id: string
          branch_id: string
          type: string
          amount: number
          description: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          shift_id: string
          branch_id: string
          type: string
          amount: number
          description?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          shift_id?: string
          branch_id?: string
          type?: string
          amount?: number
          description?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
