import { useRef } from 'react'
import { Printer, MessageSquare, X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { formatRupiah, formatDate } from '@/lib/utils'
import type { CartItem } from '@/types/app.types'

export interface ReceiptData {
  receiptNumber: string
  businessName: string
  createdAt: string
  items: CartItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  paymentMethod: string
  paidAmount: number
  changeAmount: number
  cashierName: string
}

interface ReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ReceiptData | null
  onNewTransaction: () => void
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer Bank',
}

export function ReceiptModal({ open, onOpenChange, data, onNewTransaction }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    if (!receiptRef.current) return
    const content = receiptRef.current.innerHTML
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Struk - ${data?.receiptNumber}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 8px; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .separator { border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .item-name { flex: 1; }
            .item-price { text-align: right; min-width: 80px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  function handleWhatsApp() {
    if (!data) return
    const items = data.items
      .map((i) => `• ${i.name} x${i.quantity} = ${formatRupiah(i.price * i.quantity)}`)
      .join('\n')
    const text = [
      `🧾 *Struk ${data.businessName}*`,
      `No: ${data.receiptNumber}`,
      `Tgl: ${formatDate(data.createdAt)}`,
      '',
      items,
      '',
      `Subtotal: ${formatRupiah(data.subtotal)}`,
      data.discountAmount > 0 ? `Diskon: -${formatRupiah(data.discountAmount)}` : null,
      data.taxAmount > 0 ? `Pajak: ${formatRupiah(data.taxAmount)}` : null,
      `*Total: ${formatRupiah(data.total)}*`,
      `Bayar: ${formatRupiah(data.paidAmount)} (${PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod})`,
      data.paymentMethod === 'cash' ? `Kembali: ${formatRupiah(data.changeAmount)}` : null,
      '',
      'Terima kasih! 🙏',
    ]
      .filter(Boolean)
      .join('\n')

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (!data) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Transaksi Berhasil
          </DialogTitle>
        </DialogHeader>

        {/* Struk preview */}
        <div
          ref={receiptRef}
          className="bg-white dark:bg-zinc-950 border border-border rounded-lg p-4 font-mono text-xs max-h-72 overflow-y-auto"
        >
          <div className="center bold text-sm mb-1">{data.businessName}</div>
          <div className="center text-muted-foreground">{formatDate(data.createdAt)}</div>
          <div className="center text-muted-foreground mb-2">No: {data.receiptNumber}</div>

          <div className="separator" />

          {data.items.map((item, i) => (
            <div key={i} className="mb-1">
              <div className="bold">{item.name}</div>
              <div className="row">
                <span className="text-muted-foreground">
                  {item.quantity} × {formatRupiah(item.price)}
                </span>
                <span>{formatRupiah(item.price * item.quantity)}</span>
              </div>
              {item.addons.map((a, ai) => (
                <div key={ai} className="row text-muted-foreground pl-2">
                  <span>+ {a.name}</span>
                  <span>{formatRupiah(a.price)}</span>
                </div>
              ))}
            </div>
          ))}

          <div className="separator" />

          <div className="row">
            <span>Subtotal</span><span>{formatRupiah(data.subtotal)}</span>
          </div>
          {data.discountAmount > 0 && (
            <div className="row">
              <span>Diskon</span><span>-{formatRupiah(data.discountAmount)}</span>
            </div>
          )}
          {data.taxAmount > 0 && (
            <div className="row">
              <span>Pajak</span><span>{formatRupiah(data.taxAmount)}</span>
            </div>
          )}
          <div className="row bold text-sm">
            <span>TOTAL</span><span>{formatRupiah(data.total)}</span>
          </div>

          <div className="separator" />

          <div className="row">
            <span>{PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod}</span>
            <span>{formatRupiah(data.paidAmount)}</span>
          </div>
          {data.paymentMethod === 'cash' && (
            <div className="row">
              <span>Kembali</span><span>{formatRupiah(data.changeAmount)}</span>
            </div>
          )}

          <div className="separator" />
          <div className="center text-muted-foreground">Kasir: {data.cashierName}</div>
          <div className="center bold mt-2">Terima kasih! 🙏</div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleWhatsApp}>
            <MessageSquare className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
        </div>

        <Button className="w-full" onClick={onNewTransaction}>
          <X className="mr-2 h-4 w-4" />
          Transaksi Baru
        </Button>
      </DialogContent>
    </Dialog>
  )
}
