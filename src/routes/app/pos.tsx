import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Search, ShoppingCart, Plus, Minus, Trash2, Tag,
  Package, Clock, Scan,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart.store'
import { useShiftStore } from '@/stores/shift.store'
import { useProducts, useCategories } from '@/hooks/use-products'
import { useActiveShift, useOpenShift, useCloseShift, useCreateTransaction, useShiftSummary } from '@/hooks/use-pos'
import { useTenant } from '@/hooks/use-tenant'
import { branchService } from '@/services/pos.service'
import { OpenShiftModal, CloseShiftModal } from '@/components/pos/shift-modal'
import { PaymentModal } from '@/components/pos/payment-modal'
import { ReceiptModal, type ReceiptData } from '@/components/pos/receipt-modal'
import { BarcodeScanner } from '@/components/pos/barcode-scanner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { formatRupiah } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ProductWithCategory, CartItem } from '@/types/app.types'

export const Route = createFileRoute('/app/pos')({
  component: PosPage,
})

function PosPage() {
  const { tenantId, tenantUser, tenant } = useTenant()

  // Cart state
  const {
    items, subtotal, discountAmount, taxAmount, total, itemCount,
    addItem, removeItem, updateQty, setDiscount, clearCart,
  } = useCartStore()

  // Shift state
  const { activeShift, openShift: openShiftStore, closeShift: closeShiftStore } = useShiftStore()

  // Queries
  const { data: serverShift, isLoading: shiftLoading } = useActiveShift()
  const { data: shiftSummary } = useShiftSummary(activeShift?.id ?? null)
  const { data: categories } = useCategories()
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const { data: products, isLoading: productsLoading } = useProducts({
    isActive: true,
    categoryId: categoryFilter || undefined,
    search: search || undefined,
  })

  // Mutations
  const openShiftMutation = useOpenShift()
  const closeShiftMutation = useCloseShift()
  const createTransaction = useCreateTransaction()

  // Modal state
  const [openShiftModal, setOpenShiftModal] = useState(false)
  const [closeShiftModal, setCloseShiftModal] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [discountInput, setDiscountInput] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)

  // Sync server shift to zustand store on load
  useEffect(() => {
    if (serverShift && !activeShift) {
      openShiftStore(serverShift)
    } else if (!serverShift && activeShift) {
      closeShiftStore()
    }
  }, [serverShift, activeShift, openShiftStore, closeShiftStore])

  // ===========================
  // SHIFT HANDLERS
  // ===========================

  async function handleOpenShift(openingCash: number) {
    // Get main branch
    const branch = await branchService.getMainBranch(tenantId)
    if (!branch) {
      toast.error('Branch tidak ditemukan. Hubungi admin.')
      return
    }
    const shift = await openShiftMutation.mutateAsync({ branchId: branch.id, openingCash })
    openShiftStore(shift)
    setOpenShiftModal(false)
  }

  async function handleCloseShift(closingCash: number, notes: string) {
    if (!activeShift) return
    await closeShiftMutation.mutateAsync({
      shiftId: activeShift.id,
      closingCash,
      notes,
    })
    closeShiftStore()
    setCloseShiftModal(false)
  }

  // ===========================
  // CART HANDLERS
  // ===========================

  function handleAddProduct(product: ProductWithCategory) {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.sell_price,
      addons: [],
      imageUrl: product.image_url ?? undefined,
    })
  }

  function handleBarcodeScanned(barcode: string) {
    // Find product by barcode and add to cart
    const found = products?.find(
      (p) => p.barcode === barcode || p.sku === barcode
    )
    if (found) {
      handleAddProduct(found)
    } else {
      setSearch(barcode)
    }
  }

  function handleDiscount() {
    const val = Number(discountInput)
    if (isNaN(val) || val < 0) {
      toast.error('Diskon tidak valid')
      return
    }
    if (val > subtotal) {
      toast.error('Diskon tidak boleh melebihi subtotal')
      return
    }
    setDiscount(val)
    setDiscountInput('')
  }

  // ===========================
  // PAYMENT
  // ===========================

  async function handleConfirmPayment(method: 'cash' | 'qris' | 'transfer', paidAmount: number) {
    if (!activeShift) {
      toast.error('Buka shift terlebih dahulu')
      return
    }
    if (items.length === 0) {
      toast.error('Keranjang kosong')
      return
    }

    const branch = await branchService.getMainBranch(tenantId)
    if (!branch) {
      toast.error('Branch tidak ditemukan')
      return
    }

    const txn = await createTransaction.mutateAsync({
      tenantId,
      branchId: branch.id,
      shiftId: activeShift.id,
      cashierId: tenantUser.id,
      customerId: null,
      items,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      paymentMethod: method,
      paidAmount,
    })

    setPaymentOpen(false)
    setReceipt({
      receiptNumber: txn.receipt_number,
      businessName: tenant.business_name,
      createdAt: txn.created_at,
      items,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      paymentMethod: method,
      paidAmount,
      changeAmount: Math.max(0, paidAmount - total),
      cashierName: tenantUser.name,
    })
  }

  function handleNewTransaction() {
    clearCart()
    setReceipt(null)
    setDiscount(0)
  }

  // ===========================
  // RENDER
  // ===========================

  if (shiftLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-3">
          <Skeleton className="h-10 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    )
  }

  // No active shift
  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-6 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Belum ada shift aktif</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Buka shift untuk mulai menerima transaksi. Masukkan kas awal di laci kasir.
        </p>
        <Button onClick={() => setOpenShiftModal(true)}>
          Buka Shift Sekarang
        </Button>
        <OpenShiftModal
          open={openShiftModal}
          onOpenChange={setOpenShiftModal}
          onConfirm={handleOpenShift}
          isPending={openShiftMutation.isPending}
        />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* LEFT — Product Grid */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border space-y-2">
          {/* Search + Scan */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari produk atau scan barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setScannerOpen(true)}
              title="Scan Barcode"
            >
              <Scan className="h-4 w-4" />
            </Button>
          </div>

          {/* Category chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setCategoryFilter('')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-full border whitespace-nowrap transition-colors shrink-0',
                categoryFilter === ''
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              )}
            >
              Semua
            </button>
            {(categories ?? []).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full border whitespace-nowrap transition-colors shrink-0',
                  categoryFilter === cat.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                )}
              >
                {cat.icon && <span className="mr-1">{cat.icon}</span>}
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
          ) : (products ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="w-10 h-10 mb-2" />
              <p className="text-sm">Tidak ada produk</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {(products ?? []).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={() => handleAddProduct(product)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Cart */}
      <div className="w-80 xl:w-96 flex flex-col bg-card">
        {/* Cart header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-sm">Keranjang</span>
            {itemCount > 0 && (
              <Badge variant="secondary" className="text-xs">{itemCount}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={() => clearCart()}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Kosongkan
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={() => setCloseShiftModal(true)}
            >
              Tutup Shift
            </Button>
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Tap produk untuk menambahkan</p>
            </div>
          ) : (
            items.map((item) => (
              <CartItemRow
                key={`${item.productId}-${item.variantId}`}
                item={item}
                onUpdateQty={(qty) => updateQty(item.productId, qty, item.variantId)}
                onRemove={() => removeItem(item.productId, item.variantId)}
              />
            ))
          )}
        </div>

        {/* Summary + discount */}
        {items.length > 0 && (
          <div className="border-t border-border px-4 py-3 space-y-3">
            {/* Diskon */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="number"
                  min={0}
                  placeholder="Diskon (Rp)"
                  className="w-full pl-8 pr-2 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDiscount()}
                />
              </div>
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={handleDiscount}>
                Terapkan
              </Button>
            </div>

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon</span>
                  <span>-{formatRupiah(discountAmount)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Pajak</span>
                  <span>{formatRupiah(taxAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatRupiah(total)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => setPaymentOpen(true)}
              disabled={items.length === 0}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Bayar {formatRupiah(total)}
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <CloseShiftModal
        open={closeShiftModal}
        onOpenChange={setCloseShiftModal}
        shift={activeShift}
        summary={shiftSummary}
        onConfirm={handleCloseShift}
        isPending={closeShiftMutation.isPending}
      />

      <PaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={total}
        onConfirm={handleConfirmPayment}
        isPending={createTransaction.isPending}
      />

      <ReceiptModal
        open={!!receipt}
        onOpenChange={(v) => { if (!v) handleNewTransaction() }}
        data={receipt}
        onNewTransaction={handleNewTransaction}
      />

      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleBarcodeScanned}
      />
    </div>
  )
}

// ===========================
// Product Card
// ===========================

function ProductCard({
  product, onAdd,
}: {
  product: ProductWithCategory
  onAdd: () => void
}) {
  return (
    <button
      onClick={onAdd}
      className="flex flex-col border border-border rounded-lg bg-card p-3 hover:bg-muted/50 active:scale-[0.98] transition-all text-left w-full"
    >
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-20 object-cover rounded-md mb-2"
        />
      ) : (
        <div className="w-full h-20 bg-muted rounded-md mb-2 flex items-center justify-center">
          <Package className="w-8 h-8 text-muted-foreground/40" />
        </div>
      )}
      <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight mb-1">
        {product.name}
      </p>
      <p className="text-sm font-bold text-foreground mt-auto">
        {formatRupiah(product.sell_price)}
      </p>
    </button>
  )
}

// ===========================
// Cart Item Row
// ===========================

function CartItemRow({
  item, onUpdateQty,
}: {
  item: CartItem
  onUpdateQty: (qty: number) => void
  onRemove: () => void
}) {
  const lineTotal = item.price * item.quantity
    + item.addons.reduce((s: number, a: CartItem['addons'][number]) => s + a.price, 0) * item.quantity

  return (
    <div className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
        {item.variantName && (
          <p className="text-[10px] text-muted-foreground">{item.variantName}</p>
        )}
        <p className="text-xs text-muted-foreground">{formatRupiah(lineTotal)}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onUpdateQty(item.quantity - 1)}
          className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          {item.quantity === 1 ? (
            <Trash2 className="w-3 h-3 text-destructive" />
          ) : (
            <Minus className="w-3 h-3" />
          )}
        </button>
        <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
        <button
          onClick={() => onUpdateQty(item.quantity + 1)}
          className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
