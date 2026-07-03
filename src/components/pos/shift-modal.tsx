import { useState } from 'react'
import { Loader2, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { formatRupiah } from '@/lib/utils'
import type { Shift } from '@/types/app.types'

// ===========================
// OPEN SHIFT MODAL
// ===========================

interface OpenShiftModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (openingCash: number) => void
  isPending: boolean
}

export function OpenShiftModal({ open, onOpenChange, onConfirm, isPending }: OpenShiftModalProps) {
  const [openingCash, setOpeningCash] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm(Number(openingCash) || 0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Buka Shift Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="opening-cash">Kas Awal (Rp)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="opening-cash"
                type="number"
                min={0}
                step={1000}
                placeholder="0"
                className="pl-9"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Jumlah uang tunai di laci kasir saat mulai shift.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buka Shift
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ===========================
// CLOSE SHIFT MODAL
// ===========================

interface CloseShiftModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shift: Shift
  summary: {
    totalSales: number
    transactionCount: number
    cashSales: number
    qrisSales: number
    transferSales: number
  } | undefined
  onConfirm: (closingCash: number, notes: string) => void
  isPending: boolean
}

export function CloseShiftModal({
  open, onOpenChange, shift, summary, onConfirm, isPending,
}: CloseShiftModalProps) {
  const [closingCash, setClosingCash] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm(Number(closingCash) || 0, notes)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Tutup Shift</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rekap */}
          {summary && (
            <div className="space-y-2 bg-muted/50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Penjualan</span>
                <span className="font-semibold">{formatRupiah(summary.totalSales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah Transaksi</span>
                <span>{summary.transactionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tunai</span>
                <span>{formatRupiah(summary.cashSales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">QRIS</span>
                <span>{formatRupiah(summary.qrisSales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transfer</span>
                <span>{formatRupiah(summary.transferSales)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border">
                <span className="text-muted-foreground">Kas Awal</span>
                <span>{formatRupiah(shift.opening_cash)}</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="closing-cash">Kas Akhir (Rp)</Label>
            <Input
              id="closing-cash"
              type="number"
              min={0}
              step={1000}
              placeholder="0"
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shift-notes">Catatan (opsional)</Label>
            <Input
              id="shift-notes"
              placeholder="catatan penutupan shift..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tutup Shift
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
