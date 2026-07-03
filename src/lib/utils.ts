import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatDateFns } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date | number, formatStr: string = 'dd MMM yyyy HH:mm'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  try {
    return formatDateFns(d, formatStr)
  } catch {
    return '-'
  }
}

export function generateReceiptNumber(prefix: string = 'TRX'): string {
  const dateStr = formatDateFns(new Date(), 'yyyyMMdd')
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString()
  return `${prefix}-${dateStr}-${randomStr}`
}

export function calcPercentage(value: number, total: number): number {
  if (!total || total === 0) return 0
  return parseFloat(((value / total) * 100).toFixed(2))
}
