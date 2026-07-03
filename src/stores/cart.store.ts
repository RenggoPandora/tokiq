import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartAddon, CartItem } from '@/types/app.types'

interface CartStore {
  items: CartItem[]
  discount: number
  taxRate: number
  notes: string
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQty: (productId: string, qty: number, variantId?: string) => void
  addAddon: (productId: string, addon: CartAddon, variantId?: string) => void
  removeAddon: (productId: string, addonId: string, variantId?: string) => void
  setDiscount: (amount: number) => void
  setTaxRate: (rate: number) => void
  setNotes: (notes: string) => void
  clearCart: () => void
  readonly subtotal: number
  readonly discountAmount: number
  readonly taxAmount: number
  readonly total: number
  readonly itemCount: number
}

function getItemKey(productId: string, variantId?: string) {
  return variantId ? `${productId}-${variantId}` : productId
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,
      taxRate: 0,
      notes: '',

      addItem: (item) =>
        set((state) => {
          const key = getItemKey(item.productId, item.variantId)
          const existing = state.items.find(
            (i) => getItemKey(i.productId, i.variantId) === key
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                getItemKey(i.productId, i.variantId) === key
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1, addons: item.addons ?? [] }] }
        }),

      removeItem: (productId, variantId) =>
        set((state) => {
          const key = getItemKey(productId, variantId)
          return {
            items: state.items.filter(
              (i) => getItemKey(i.productId, i.variantId) !== key
            ),
          }
        }),

      updateQty: (productId, qty, variantId) =>
        set((state) => {
          const key = getItemKey(productId, variantId)
          if (qty <= 0) {
            return {
              items: state.items.filter(
                (i) => getItemKey(i.productId, i.variantId) !== key
              ),
            }
          }
          return {
            items: state.items.map((i) =>
              getItemKey(i.productId, i.variantId) === key
                ? { ...i, quantity: qty }
                : i
            ),
          }
        }),

      addAddon: (productId, addon, variantId) =>
        set((state) => {
          const key = getItemKey(productId, variantId)
          return {
            items: state.items.map((i) =>
              getItemKey(i.productId, i.variantId) === key
                ? { ...i, addons: [...(i.addons ?? []), addon] }
                : i
            ),
          }
        }),

      removeAddon: (productId, addonId, variantId) =>
        set((state) => {
          const key = getItemKey(productId, variantId)
          return {
            items: state.items.map((i) =>
              getItemKey(i.productId, i.variantId) === key
                ? { ...i, addons: i.addons.filter((a) => a.id !== addonId) }
                : i
            ),
          }
        }),

      setDiscount: (amount) => set({ discount: amount }),
      setTaxRate: (rate) => set({ taxRate: rate }),
      setNotes: (notes) => set({ notes }),
      clearCart: () => set({ items: [], discount: 0, notes: '' }),

      get subtotal() {
        return get().items.reduce((sum, item) => {
          const addonTotal = item.addons.reduce((a, addon) => a + addon.price, 0)
          return sum + (item.price + addonTotal) * item.quantity
        }, 0)
      },

      get discountAmount() {
        return get().discount
      },

      get taxAmount() {
        const { subtotal, discount, taxRate } = get()
        return Math.round((subtotal - discount) * taxRate)
      },

      get total() {
        const { subtotal, discount, taxAmount } = get()
        return subtotal - discount + taxAmount
      },

      get itemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'tokiq-cart',
      partialize: (state) => ({
        items: state.items,
        discount: state.discount,
        taxRate: state.taxRate,
        notes: state.notes,
      }),
    }
  )
)
