import { useState } from 'react'
import { Banknote, QrCode, ArrowLeftRight, Loader2, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { formatRupiah } from '@/lib/utils'
import { cn } from '@/lib/utils'

type PaymentMethod = 'cash' | 'qris' | 'transfer'

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  onConfirm: (method: PaymentMethod, paidAmount: number) => void
  isPending: boolean
}

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000]

const METHOD_OPTIONS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'cash', label: 'Tunai', icon: Banknote },
  { value: 'qris', label: 'QRIS', icon: QrCode },
  { value: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
]

export function PaymentModal({ open, onOpenChange, total, onConfirm, isPending }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [paidAmount, setPaidAmount] = useState('')

  const paid = Number(paidAmount) || 0
  const change = Math.max(0, paid - total)
  const isCash = method === 'cash'
  const canConfirm = isCash ? paid >= total : true

  function handleQuickAmount(amount: number) {
    setPaidAmount(String(Math.ceil(total / amount) * amount))
  }

  function handleMethodChange(m: PaymentMethod) {
    setMethod(m)
    if (m !== 'cash') setPaidAmount(String(total))
  }

  function handleConfirm() {
    const finalPaid = isCash ? paid : total
    onConfirm(method, finalPaid)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Pembayaran</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Tagihan</p>
            <p className="text-3xl font-bold font-mono text-foreground">{formatRupiah(total)}</p>
          </div>

          {/* Payment method */}
          <div className="grid grid-cols-3 gap-2">
            {METHOD_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleMethodChange(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm font-medium transition-colors',
                    method === opt.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* Cash input */}
          {isCash && (
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="paid-amount">Uang Diterima (Rp)</Label>
                <div className="relative">
                  <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="paid-amount"
                    type="number"
                    min={total}
                    step={1000}
                    placeholder={String(total)}
                    className="pl-9 text-lg font-mono"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaidAmount(String(total))}
                  className="px-2 py-1.5 text-xs rounded-md border border-border bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pas
                </button>
                {QUICK_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => handleQuickAmount(a)}
                    className="px-2 py-1.5 text-xs rounded-md border border-border bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {a >= 1000 ? `${a / 1000}rb` : String(a)}
                  </button>
                ))}
              </div>

              {/* Change */}
              {paid > 0 && (
                <div className={cn(
                  'flex justify-between items-center p-3 rounded-lg text-sm',
                  paid >= total ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'
                )}>
                  <span className="text-muted-foreground">Kembalian</span>
                  <span className={cn(
                    'font-bold font-mono text-base',
                    paid >= total ? 'text-green-600' : 'text-destructive'
                  )}>
                    {paid >= total ? formatRupiah(change) : `Kurang ${formatRupiah(total - paid)}`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Non-cash info */}
          {!isCash && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-center text-muted-foreground">
              {method === 'qris'
                ? 'Pelanggan scan QRIS statis dan bayar sejumlah tagihan.'
                : 'Pelanggan transfer ke rekening toko sejumlah tagihan.'}
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleConfirm}
            disabled={!canConfirm || isPending}
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</>
            ) : (
              `Konfirmasi ${METHOD_OPTIONS.find((m) => m.value === method)?.label}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
